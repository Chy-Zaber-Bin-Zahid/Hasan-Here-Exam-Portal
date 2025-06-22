"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Edit, Trash2, Eye, Loader2 } from "lucide-react"
import { ViewWritingQuestionModal } from "@/components/view-writing-question-modal"
import { EditWritingQuestionModal } from "@/components/edit-writing-question-modal"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Search } from "lucide-react"

export function ManageWritingQuestions() {
  const { toast } = useToast()
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingQuestion, setViewingQuestion] = useState<any>(null)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    loadQuestionsFromDatabase()
  }, [])

  const loadQuestionsFromDatabase = async () => {
    try {
      setLoading(true)
      console.log("🔍 Loading writing questions from database...")

      const response = await fetch("/api/writing-questions")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Handle different response formats safely
      let questionsArray = []
      if (Array.isArray(data)) {
        questionsArray = data
      } else if (data && Array.isArray(data.questions)) {
        questionsArray = data.questions
      } else if (data && typeof data === "object") {
        questionsArray = [data]
      }

      console.log("✍️ Writing questions loaded:", questionsArray.length)
      setQuestions(questionsArray)
    } catch (error) {
      console.error("❌ Error loading writing questions:", error)
      toast({
        title: "Error",
        description: "Failed to load writing questions from database.",
        variant: "destructive",
      })
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  const filteredQuestions = questions.filter((question) => {
    const title = question.title || question.prompt || `Question ${question.id}`
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase())

    if (dateFilter === "all") return matchesSearch

    const questionDate = new Date(question.created_at || question.createdAt || Date.now())
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
      console.log("🗑️ Deleting writing question:", id)

      const response = await fetch(`/api/writing-questions/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setQuestions(questions.filter((q) => q.id !== id))

      toast({
        title: "Question deleted",
        description: "The writing question set has been deleted successfully.",
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

  const handleView = (question: any) => {
    setViewingQuestion(question)
  }

  const handleEdit = (question: any) => {
    setEditingQuestion(question)
  }

  const handleEditSave = async (updatedQuestion: any) => {
    try {
      console.log("✏️ Updating writing question:", updatedQuestion.id)

      const response = await fetch(`/api/writing-questions/${updatedQuestion.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedQuestion),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setQuestions(questions.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q)))
      setEditingQuestion(null)

      toast({
        title: "Question updated",
        description: "The writing question set has been updated successfully.",
      })
    } catch (error) {
      console.error("❌ Error updating question:", error)
      toast({
        title: "Error",
        description: "Failed to update the question.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading writing questions from database...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
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

      {/* Results Summary */}
      {(searchTerm || dateFilter !== "all") && (
        <div className="text-sm text-gray-600 px-1">
          Showing {filteredQuestions.length} of {questions.length} questions
          {searchTerm && ` matching "${searchTerm}"`}
          {dateFilter !== "all" &&
            ` from ${dateFilter === "today" ? "today" : dateFilter === "week" ? "last week" : "last month"}`}
        </div>
      )}

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-8">
          {questions.length === 0 ? (
            <>
              <p className="text-gray-500 mb-4">No writing questions found in database.</p>
              <p className="text-sm text-gray-400">Create some questions first to manage them here.</p>
            </>
          ) : (
            <>
              <p className="text-gray-500 mb-4">No questions match your search criteria.</p>
              <p className="text-sm text-gray-400">Try adjusting your search term or date filter.</p>
            </>
          )}
        </div>
      ) : (
        filteredQuestions.map((question) => (
          <Card key={question.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">
                {question.title || question.prompt?.substring(0, 50) + "..." || `Question ${question.id}`}
              </CardTitle>
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
                <div className="text-sm text-gray-600">
                  <strong>Prompt Preview:</strong>
                  <div className="bg-gray-50 p-2 rounded mt-1 whitespace-pre-wrap text-xs break-words overflow-hidden">
                    {(question.prompt || "No prompt available").substring(0, 150)}...
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Instructions Preview:</strong>
                  <div className="bg-gray-50 p-2 rounded mt-1 whitespace-pre-wrap text-xs break-words overflow-hidden">
                    {(question.instructions || "No instructions available").substring(0, 150)}...
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  <strong>Word Limit:</strong> {question.word_limit || "Not specified"} words
                </p>
                <p className="text-xs text-gray-400">
                  Created: {new Date(question.created_at || question.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Modals */}
      {viewingQuestion && (
        <ViewWritingQuestionModal
          question={viewingQuestion}
          open={!!viewingQuestion}
          onOpenChange={(open) => !open && setViewingQuestion(null)}
        />
      )}
      {editingQuestion && (
        <EditWritingQuestionModal
          question={editingQuestion}
          open={!!editingQuestion}
          onOpenChange={(open) => !open && setEditingQuestion(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  )
}
