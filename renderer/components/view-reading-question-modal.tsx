"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { BookOpen } from "lucide-react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"

interface ViewReadingQuestionModalProps {
  question: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewReadingQuestionModal({ question, open, onOpenChange }: ViewReadingQuestionModalProps) {
  if (!question) return null

  // Parse the new, complex structure from the `questions` JSON string
  let passages = []
  try {
    if (typeof question.questions === "string") {
      passages = JSON.parse(question.questions)
    } else if (Array.isArray(question.questions)) {
      passages = question.questions
    }
  } catch (error) {
    console.error("Error parsing reading passages for view:", error)
  }

  if (!Array.isArray(passages)) {
    passages = []
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question.title}</DialogTitle>
          <DialogDescription>Preview of the complete reading exam set.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
            {passages.map((passage: any, pIndex: number) => (
                <Card key={pIndex} className="overflow-hidden">
                    <CardHeader className="bg-gray-50 border-b">
                       <CardTitle className="text-lg flex items-center gap-2">
                           <BookOpen className="w-5 h-5 text-blue-600" /> 
                           Passage {pIndex + 1}: {passage.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2 text-gray-800">Passage Text</h4>
                            <div className="bg-gray-100 p-3 rounded-lg max-h-60 overflow-y-auto border">
                                {/* This class preserves line breaks in the passage */}
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {passage.passage}
                                </p>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2 text-gray-800">Instructions & Questions</h4>
                             <Accordion type="single" collapsible className="w-full">
                                {passage.instructionGroups?.map((group: any, gIndex: number) => (
                                    <AccordionItem value={`group-${gIndex}`} key={gIndex}>
                                        <AccordionTrigger className="text-base">Instruction Group {gIndex + 1}</AccordionTrigger>
                                        <AccordionContent>
                                            {/* This class preserves line breaks for instructions */}
                                            <p className="text-sm italic text-gray-600 mb-4 p-3 bg-blue-50 rounded-md border border-blue-200 whitespace-pre-wrap">
                                                {group.instructionText}
                                            </p>
                                            <ul className="space-y-3 pl-2">
                                                {group.questions?.map((q: any, qIndex: number) => (
                                                    <li key={qIndex} className="text-sm flex items-start gap-2">
                                                        <span className="font-bold text-gray-500">{qIndex + 1}.</span>
                                                        {/* This class preserves line breaks for questions */}
                                                        <span className="flex-1 whitespace-pre-wrap">{q.text}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </CardContent>
                </Card>
            ))}
          <Button onClick={() => onOpenChange(false)} className="w-full mt-4">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}