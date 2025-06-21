"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Edit, Trash2, Eye } from "lucide-react"
import { EditReadingQuestionModal } from "@/components/edit-reading-question-modal"
import { ViewReadingQuestionModal } from "@/components/view-reading-question-modal"

export function ManageReadingQuestions() {
  const { toast } = useToast()
  const [questions, setQuestions] = useState<any[]>([])
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [viewingQuestion, setViewingQuestion] = useState<any>(null)

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = () => {
    const saved = JSON.parse(localStorage.getItem("readingQuestions") || "[]")
    setQuestions(saved)
  }

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

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No reading questions found.</p>
        <p className="text-sm text-gray-400">Create some questions first to manage them here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => (
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
      ))}

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
