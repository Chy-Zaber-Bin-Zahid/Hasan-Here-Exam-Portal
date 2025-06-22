"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ViewListeningQuestionModalProps {
  question: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewListeningQuestionModal({ question, open, onOpenChange }: ViewListeningQuestionModalProps) {
  if (!question) return null

  // Safely parse questions from JSON string
  let parsedQuestions = []
  try {
    if (typeof question.questions === "string") {
      parsedQuestions = JSON.parse(question.questions)
    } else if (Array.isArray(question.questions)) {
      parsedQuestions = question.questions
    }
  } catch (error) {
    console.error("Error parsing questions:", error)
    parsedQuestions = []
  }

  // Ensure parsedQuestions is always an array
  if (!Array.isArray(parsedQuestions)) {
    parsedQuestions = []
  }

  console.log("📋 Viewing listening question:", {
    title: question.title,
    questionsType: typeof question.questions,
    parsedCount: parsedQuestions.length,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question.title || "Listening Question"}</DialogTitle>
          <DialogDescription>Preview of the listening question set</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Audio File</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Audio URL:</strong> {question.audio_url || "No audio file"}
                </p>
                {question.text && (
                  <p className="text-sm mt-2">
                    <strong>Description:</strong> {question.text}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Questions ({parsedQuestions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {parsedQuestions.length > 0 ? (
                <div className="space-y-3">
                  {parsedQuestions.map((q: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                        <span className="font-medium">{index + 1}.</span>{" "}
                        {q.text || q.question || `Question ${index + 1}`}
                      </p>
                      {q.options && Array.isArray(q.options) && (
                        <div className="mt-2 ml-4 space-y-1">
                          {q.options.map((option: string, optIndex: number) => (
                            <p key={optIndex} className="text-xs text-gray-600">
                              {String.fromCharCode(65 + optIndex)}. {option}
                            </p>
                          ))}
                          {typeof q.correctAnswer === "number" && (
                            <p className="text-xs text-green-600 font-medium mt-1">
                              Correct: {String.fromCharCode(65 + q.correctAnswer)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No questions available for this listening exercise.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-xs text-gray-500 space-y-1">
            <p>Created: {question.created_at ? new Date(question.created_at).toLocaleString() : "Unknown"}</p>
          </div>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
