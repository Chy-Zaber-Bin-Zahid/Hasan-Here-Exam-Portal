"use client"

import { EditReadingQuestionModal } from "./edit-reading-question-modal"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { ViewReadingQuestionModal } from "./view-reading-question-modal"
import { BookOpen, CalendarIcon, Edit, Eye, Loader2, Search, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useToast } from "../hooks/use-toast"
import { Button } from "./ui/button"

// Helper function to count total questions in the new nested format
const getTotalQuestionCount = (question: any): number => {
    if (!question || !question.questions) return 0;
    try {
        const passages = JSON.parse(question.questions);
        if (!Array.isArray(passages)) return 0;
        
        return passages.reduce((total, passage) => {
            if (!passage.instructionGroups) return total;
            const passageQuestions = passage.instructionGroups.reduce((subTotal: any, group: any) => {
                return subTotal + (group.questions?.length || 0);
            }, 0);
            return total + passageQuestions;
        }, 0);
    } catch (e) {
        console.error("Failed to parse questions for count:", e);
        return 0;
    }
}

export function ManageReadingQuestions() {
  const { toast } = useToast()
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [viewingQuestion, setViewingQuestion] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    if (!Array.isArray(questions)) {
      setQuestions([])
    }
  }, [questions])

  useEffect(() => {
    loadQuestionsFromDatabase()
  }, [])

  const loadQuestionsFromDatabase = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/reading-questions")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      const questionsArray = data.questions || data || []
      setQuestions(questionsArray)
    } catch (error) {
      console.error("❌ Error loading reading questions:", error)
      toast({
        title: "Error",
        description: "Failed to load reading questions from database.",
        variant: "destructive",
      })
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  const filteredQuestions = questions.filter((question) => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase())

    if (dateFilter === "all") return matchesSearch

    const questionDate = new Date(question.created_at)
    const now = new Date()

    switch (dateFilter) {
      case "today":
        return matchesSearch && questionDate.toDateString() === now.toDateString()
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return matchesSearch && questionDate >= weekAgo
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return matchesSearch && questionDate >= monthAgo
      default:
        return matchesSearch
    }
  })

  const deleteQuestion = async (id: number) => {
    try {
      const response = await fetch(`/api/reading-questions/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setQuestions(questions.filter((q) => q.id !== id))
      toast({
        title: "Question deleted",
        description: "The reading question set has been deleted successfully.",
      })
    } catch (error) {
      console.error("❌ Error deleting question:", error)
      toast({
        title: "Error",
        description: "Failed to delete the question.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (question: any) => {
    setEditingQuestion(question)
  }

  const handleView = (question: any) => {
    setViewingQuestion(question)
  }

  const handleEditSave = async (updatedQuestion: any) => {
    try {
      setEditingQuestion(null);
      setLoading(true); // Show loading state while saving

      const response = await fetch(`/api/reading-questions/${updatedQuestion.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedQuestion),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      toast({
        title: "Question updated",
        description: "The reading question set has been updated successfully.",
      })
      
      // Reload all data from the server to ensure consistency
      await loadQuestionsFromDatabase();

    } catch (error) {
      console.error("❌ Error updating question:", error)
      toast({
        title: "Error",
        description: "Failed to update the question.",
        variant: "destructive",
      })
    } finally {
        setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading reading questions...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <CalendarIcon className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No reading questions found.</p>
        </div>
      ) : (
        filteredQuestions.map((question) => {
          const totalQuestions = getTotalQuestionCount(question);
          return (
            <Card key={question.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">{question.title}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleView(question)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(question)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteQuestion(question.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> 
                    <strong>3 Passages</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Total Questions:</strong> {totalQuestions}
                  </p>
                  <p className="text-xs text-gray-400">
                    Created: {new Date(question.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}

      {editingQuestion && (
        <EditReadingQuestionModal
          question={editingQuestion}
          open={!!editingQuestion}
          onOpenChange={(open) => !open && setEditingQuestion(null)}
          onSave={handleEditSave}
        />
      )}

      {viewingQuestion && (
        <ViewReadingQuestionModal
          question={viewingQuestion}
          open={!!viewingQuestion}
          onOpenChange={(open) => !open && setViewingQuestion(null)}
        />
      )}
    </div>
  )
}