"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ViewWritingQuestionModalProps {
  question: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewWritingQuestionModal({ question, open, onOpenChange }: ViewWritingQuestionModalProps) {
  if (!question) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question.title}</DialogTitle>
          <DialogDescription>Preview of the writing question set</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Writing Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                  {question.prompt}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instructions & Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                  {question.instructions}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="text-xs text-gray-500 space-y-1">
            {/* FIX: Changed 'question.createdAt' to 'question.created_at' to match the database property */}
            <p>Created: {question.created_at ? new Date(question.created_at).toLocaleString() : "Date not available"}</p>
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