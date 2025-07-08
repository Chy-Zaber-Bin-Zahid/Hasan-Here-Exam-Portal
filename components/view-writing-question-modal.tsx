"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageIcon, FileText } from "lucide-react"

interface ViewWritingQuestionModalProps {
  question: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewWritingQuestionModal({ question, open, onOpenChange }: ViewWritingQuestionModalProps) {
  if (!question) return null;

  let prompts = { task1: "", task2: "" };
  let details = { task2: "", imageUrl: "" };

  try {
    if (typeof question.prompt === 'string') {
      prompts = JSON.parse(question.prompt);
    }
    if (typeof question.instructions === 'string') {
      details = JSON.parse(question.instructions);
    }
  } catch(e) {
    console.error("Failed to parse writing question JSON", e);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question.title}</DialogTitle>
          <DialogDescription>Preview of the writing exam set</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Card for Task 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-blue-600" /> Writing Task 1</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {details.imageUrl && (
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Image</h3>
                        <div className="border rounded-lg p-2 bg-gray-50">
                            <img src={details.imageUrl} alt="Task 1 Prompt Image" className="max-w-full max-h-80 mx-auto" />
                        </div>
                    </div>
                )}
                <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Prompt</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        {/* This class preserves line breaks */}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {prompts.task1}
                        </p>
                    </div>
                </div>
            </CardContent>
          </Card>

          {/* Card for Task 2 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-green-600" /> Writing Task 2</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Prompt</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        {/* This class preserves line breaks */}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {prompts.task2}
                        </p>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Instructions</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        {/* This class preserves line breaks */}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {details.task2}
                        </p>
                    </div>
                </div>
            </CardContent>
          </Card>
          
          <div className="text-xs text-gray-500 pt-4 border-t">
            <p>Created: {question.created_at ? new Date(question.created_at).toLocaleString() : "Date not available"}</p>
          </div>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}