"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ViewReadingQuestionModalProps {
  question: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewReadingQuestionModal({ question, open, onOpenChange }: ViewReadingQuestionModalProps) {
  if (!question) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question.title}</DialogTitle>
          <DialogDescription>Preview of the reading question set</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reading Passage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                  {question.passage}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Questions ({question.questions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {question.questions.map((q: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                      <span className="font-medium">{index + 1}.</span> {q.text}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-xs text-gray-500 space-y-1">
            <p>Created: {new Date(question.createdAt).toLocaleString()}</p>
            {question.updatedAt && <p>Last updated: {new Date(question.updatedAt).toLocaleString()}</p>}
          </div>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
