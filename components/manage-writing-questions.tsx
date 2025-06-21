"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Edit, Trash2, Eye } from "lucide-react"
import { ViewWritingQuestionModal } from "@/components/view-writing-question-modal"

export function ManageWritingQuestions() {
  const { toast } = useToast()
  const [questions, setQuestions] = useState<any[]>([])
  const [viewingQuestion, setViewingQuestion] = useState<any>(null)

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = () => {
    const saved = JSON.parse(localStorage.getItem("writingQuestions") || "[]")
    setQuestions(saved)
  }

  const deleteQuestion = (id: number) => {
    const updatedQuestions = questions.filter((q) => q.id !== id)
    localStorage.setItem("writingQuestions", JSON.stringify(updatedQuestions))
    setQuestions(updatedQuestions)

    toast({
      title: "Question deleted",
      description: "The writing question set has been deleted successfully.",
    })
  }

  const handleView = (question: any) => {
    setViewingQuestion(question)
  }

  const handleEdit = (question: any) => {
    // TODO: Implement edit functionality
    toast({
      title: "Edit functionality",
      description: "Edit functionality will be implemented soon.",
    })
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No writing questions found.</p>
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
              <div className="text-sm text-gray-600">
                <strong>Prompt Preview:</strong>
                <div className="bg-gray-50 p-2 rounded mt-1 whitespace-pre-wrap text-xs break-words overflow-hidden">
                  {question.prompt.substring(0, 150)}...
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <strong>Instructions Preview:</strong>
                <div className="bg-gray-50 p-2 rounded mt-1 whitespace-pre-wrap text-xs break-words overflow-hidden">
                  {question.instructions.substring(0, 150)}...
                </div>
              </div>
              <p className="text-xs text-gray-400">Created: {new Date(question.createdAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      ))}
      {viewingQuestion && (
        <ViewWritingQuestionModal
          question={viewingQuestion}
          open={!!viewingQuestion}
          onOpenChange={(open) => !open && setViewingQuestion(null)}
        />
      )}
    </div>
  )
}
