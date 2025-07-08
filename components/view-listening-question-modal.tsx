"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface ViewListeningQuestionModalProps {
  question: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewListeningQuestionModal({ question, open, onOpenChange }: ViewListeningQuestionModalProps) {
  if (!question) return null

  let parsedInstructionGroups = []
  try {
    if (typeof question.questions === "string") {
      parsedInstructionGroups = JSON.parse(question.questions)
    } else if (Array.isArray(question.questions)) {
      parsedInstructionGroups = question.questions
    }
  } catch (error) {
    console.error("Error parsing questions:", error)
    parsedInstructionGroups = []
  }

  if (!Array.isArray(parsedInstructionGroups)) {
    parsedInstructionGroups = []
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
                  Filename: {question.audio_url?.split('/').pop() || "No audio file"}
                </p>
                {question.audio_url ? (
                  <audio controls src={question.audio_url} className="w-full">
                    Your browser does not support the audio element.
                  </audio>
                ) : (
                  <p className="text-sm text-muted-foreground">No audio attached.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instructions & Questions</CardTitle>
            </CardHeader>
            <CardContent>
              {parsedInstructionGroups.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {parsedInstructionGroups.map((group: any, gIndex: number) => (
                    <AccordionItem value={`group-${gIndex}`} key={gIndex}>
                      <AccordionTrigger className="text-base">Instruction Group {gIndex + 1}</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm italic text-gray-600 mb-4 p-3 bg-blue-50 rounded-md border border-blue-200 whitespace-pre-wrap">
                          {group.instructionText}
                        </p>
                        <ul className="space-y-3 pl-2">
                          {group.questions?.map((q: any, qIndex: number) => (
                            <li key={qIndex} className="text-sm flex items-start gap-2">
                              <span className="font-bold text-gray-500">{qIndex + 1}.</span>
                              <span className="flex-1 whitespace-pre-wrap">{q.text}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No instructions or questions available for this listening exercise.
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