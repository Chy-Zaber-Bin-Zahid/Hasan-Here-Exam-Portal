"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface EditWritingQuestionModalProps {
  question: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (question: any) => void
}

export function EditWritingQuestionModal({ question, open, onOpenChange, onSave }: EditWritingQuestionModalProps) {
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [prompt, setPrompt] = useState("")
  const [instructions, setInstructions] = useState("")

  useEffect(() => {
    if (question && open) {
      setTitle(question.title || "")
      setPrompt(question.prompt || "")
      setInstructions(question.instructions || "")
    }
  }, [question, open])

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a title.",
        variant: "destructive",
      })
      return
    }

    if (!prompt.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a writing prompt.",
        variant: "destructive",
      })
      return
    }

    if (!instructions.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter instructions.",
        variant: "destructive",
      })
      return
    }

    const updatedQuestion = {
      ...question,
      title: title.trim(),
      prompt: prompt.trim(),
      instructions: instructions.trim(),
      updatedAt: new Date().toISOString(),
    }

    onSave(updatedQuestion)
    onOpenChange(false)
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Writing Question</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter question title"
            />
          </div>

          {/* Writing Prompt */}
          <div>
            <Label htmlFor="prompt">Writing Prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter the writing prompt or topic"
              rows={4}
            />
          </div>

          {/* Instructions */}
          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter detailed instructions for the writing task"
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
