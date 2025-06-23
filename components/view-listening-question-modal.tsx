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
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <p className="text-sm font-medium">
                  Filename: {question.audioFileName || question.audio_url?.split('/').pop() || "No audio file"}
                </p>
                {/* FIX: Added an audio player */}
                {question.audio_url ? (
                  <audio controls src={question.audio_url} className="w-full">
                    Your browser does not support the audio element.
                  </audio>
                ) : (
                  <p className="text-sm text-muted-foreground">No audio attached.</p>
                )}
                {question.text && (
                  <p className="text-sm mt-2 pt-3 border-t">
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