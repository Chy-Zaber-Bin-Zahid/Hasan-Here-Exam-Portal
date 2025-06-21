"use client"

import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"

interface WritingForm {
  title: string
  prompt: string
  instructions: string
}

export function WritingQuestionForm() {
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WritingForm>()

  const onSubmit = (data: WritingForm) => {
    // Save to localStorage (in real app, this would be an API call)
    const existingQuestions = JSON.parse(localStorage.getItem("writingQuestions") || "[]")
    const newQuestion = {
      ...data,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    }

    const updatedQuestions = [...existingQuestions, newQuestion]
    localStorage.setItem("writingQuestions", JSON.stringify(updatedQuestions))

    toast({
      title: "Writing questions saved",
      description: "The writing prompt and instructions have been saved successfully.",
    })

    reset()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Question Set Title</Label>
          <Input
            id="title"
            placeholder="Enter a title for this writing question set"
            {...register("title", { required: "Title is required" })}
          />
          {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="prompt">Writing Prompt</Label>
          <Textarea
            id="prompt"
            placeholder="Enter the main writing prompt or topic here...&#10;Example: Write an essay about the importance of environmental conservation in modern society."
            className="min-h-[120px]"
            {...register("prompt", {
              required: "Writing prompt is required",
              minLength: { value: 20, message: "Prompt should be at least 20 characters long" },
            })}
          />
          {errors.prompt && <p className="text-sm text-red-500">{errors.prompt.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions">Instructions & Requirements</Label>
          <Textarea
            id="instructions"
            placeholder="Enter detailed instructions and requirements here...&#10;Example:&#10;- Write a minimum of 300 words&#10;- Include at least 3 supporting arguments&#10;- Use proper grammar and punctuation&#10;- Time limit: 45 minutes&#10;- Format: Formal essay with introduction, body, and conclusion"
            className="min-h-[150px]"
            {...register("instructions", {
              required: "Instructions are required",
              minLength: { value: 20, message: "Please provide detailed instructions" },
            })}
          />
          {errors.instructions && <p className="text-sm text-red-500">{errors.instructions.message}</p>}
        </div>

        <Button type="submit" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Save Writing Questions
        </Button>
      </form>
    </div>
  )
}
