"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Edit, Trash2, Eye } from "lucide-react"
import { EditReadingQuestionModal } from "@/components/edit-reading-question-modal"
import { ViewReadingQuestionModal } from "@/components/view-reading-question-modal"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Search } from "lucide-react"

export function ManageReadingQuestions() {
  const { toast } = useToast()
  const [questions, setQuestions] = useState<any[]>([])
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [viewingQuestion, setViewingQuestion] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = () => {
    const saved = JSON.parse(localStorage.getItem("readingQuestions") || "[]")
    setQuestions(saved)
  }

  const filteredQuestions = questions.filter((question) => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase())

    if (dateFilter === "all") return matchesSearch

    const questionDate = new Date(question.createdAt)
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

  const deleteQuestion = (id: number) => {
    const updatedQuestions = questions.filter((q) => q.id !== id)
    localStorage.setItem("readingQuestions", JSON.stringify(updatedQuestions))
    setQuestions(updatedQuestions)

    toast({
      title: "Question deleted",
      description: "The reading question set has been deleted successfully.",
    })
  }

  const handleEdit = (question: any) => {
    setEditingQuestion(question)
  }

  const handleView = (question: any) => {
    setViewingQuestion(question)
  }

  const handleEditSave = (updatedQuestion: any) => {
    const updatedQuestions = questions.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q))
    localStorage.setItem("readingQuestions", JSON.stringify(updatedQuestions))
    setQuestions(updatedQuestions)
    setEditingQuestion(null)

    toast({
      title: "Question updated",
      description: "The reading question set has been updated successfully.",
    })
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
              <p className="text-gray-500 mb-4">No reading questions found.</p>
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
                <p className="text-sm text-gray-600">
                  <strong>Questions:</strong> {question.questions.length} questions
                </p>
                <div className="text-sm text-gray-600">
                  <strong>Passage Preview:</strong>
                  <div className="bg-gray-50 p-2 rounded mt-1 whitespace-pre-wrap text-xs break-words overflow-hidden">
                    {question.passage.substring(0, 200)}...
                  </div>
                </div>
                <p className="text-xs text-gray-400">Created: {new Date(question.createdAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Modals remain the same */}
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
