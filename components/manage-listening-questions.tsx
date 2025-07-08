"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Edit, Trash2, Eye, Loader2, CalendarIcon, Search } from "lucide-react"
import { ViewListeningQuestionModal } from "@/components/view-listening-question-modal"
import { EditListeningQuestionModal } from "@/components/edit-listening-question-modal"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ManageListeningQuestions() {
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
      const response = await fetch("/api/listening-questions")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      const questionsArray = Array.isArray(data) ? data : data.questions || []
      setQuestions(questionsArray)
    } catch (error) {
      console.error("❌ Error loading listening questions:", error)
      toast({
        title: "Error",
        description: "Failed to load listening questions from database.",
        variant: "destructive",
      })
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

    const filteredQuestions = Array.isArray(questions)
    ? questions.filter((question) => {
        const matchesSearch = question.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false;

        if (dateFilter === "all") return matchesSearch;
        
        if (!question.created_at) return false;

        // FIX: Implement robust date filtering logic
        const questionDate = new Date(question.created_at.replace(' ', 'T') + 'Z'); // Parse as UTC
        const now = new Date();
        let matchesDate = false;

        switch (dateFilter) {
          case "today":
            matchesDate = questionDate.getFullYear() === now.getFullYear() &&
                          questionDate.getMonth() === now.getMonth() &&
                          questionDate.getDate() === now.getDate();
            break;
          case "week":
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = questionDate >= oneWeekAgo;
            break;
          case "month":
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = questionDate >= oneMonthAgo;
            break;
          default:
            matchesDate = true;
        }
        
        return matchesSearch && matchesDate;
      })
    : [];


  const deleteQuestion = async (id: number) => {
    try {
      const response = await fetch(`/api/listening-questions/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setQuestions(questions.filter((q) => q.id !== id))

      toast({
        title: "Question deleted",
        description: "The listening question set has been deleted successfully.",
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
      const response = await fetch(`/api/listening-questions/${updatedQuestion.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedQuestion),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // After saving, reload all questions to ensure data is fresh
      loadQuestionsFromDatabase();
      setEditingQuestion(null)

      toast({
        title: "Question updated",
        description: "The listening question set has been updated successfully.",
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
        <span>Loading listening questions...</span>
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
          <p>No questions match your criteria.</p>
        </div>
      ) : (
        filteredQuestions.map((question) => {
          const questionsData =
            typeof question.questions === "string" ? JSON.parse(question.questions) : (question.questions || []);
          
          const displayName = question.audio_filename || question.audio_url?.split('/').pop() || 'No filename';
          const displaySize = (question.audio_size && typeof question.audio_size === 'number') 
              ? `(${(question.audio_size / 1024 / 1024).toFixed(2)} MB)` 
              : '';

          return (
            <Card key={question.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">{question.title || `Question ${question.id}`}</CardTitle>
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
                  <p className="text-sm text-gray-600 truncate">
                    <strong>Audio:</strong> {displayName} {displaySize}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Questions:</strong> {Array.isArray(questionsData) ? questionsData.length : 0}
                  </p>
                  {Array.isArray(questionsData) && questionsData.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <strong>First Question Preview:</strong>
                      <div className="bg-gray-50 p-2 rounded mt-1 whitespace-pre-wrap text-xs break-words overflow-hidden">
                        {(questionsData[0]?.text || '').substring(0, 100)}...
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    Created: {question.created_at ? new Date(question.created_at).toLocaleDateString() : "Unknown"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}

      {viewingQuestion && (
        <ViewListeningQuestionModal
          question={viewingQuestion}
          open={!!viewingQuestion}
          onOpenChange={(open) => !open && setViewingQuestion(null)}
        />
      )}
      {editingQuestion && (
        <EditListeningQuestionModal
          question={editingQuestion}
          open={!!editingQuestion}
          onOpenChange={(open) => !open && setEditingQuestion(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  )
}