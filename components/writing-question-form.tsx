"use client"

import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Plus } from "lucide-react"

// FIX: Removed word_limit from the form's data structure
interface WritingForm {
  title: string
  prompt: string
  instructions: string
}

export function WritingQuestionForm() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WritingForm>({
    // FIX: Removed default value for word_limit
    defaultValues: {
      title: "",
      prompt: "",
      instructions: "",
    },
  })

  const onSubmit = async (data: WritingForm) => {
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/writing-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // FIX: Removed word_limit from the submitted data
        body: JSON.stringify({
          title: data.title,
          prompt: data.prompt,
          instructions: data.instructions,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Writing questions saved",
          description: "The writing prompt and instructions have been saved to database successfully.",
        })
        reset()
      } else {
        throw new Error(result.error || "Failed to save questions")
      }
    } catch (error) {
      console.error("Save error:", error)
      toast({
        title: "Save failed",
        description: "Failed to save writing questions to database. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
            placeholder="Enter detailed instructions and requirements here...&#10;Example:&#10;- Write a minimum of 300 words&#10;- Use proper grammar and punctuation&#10;- Time limit: 45 minutes&#10;- Format: Formal essay with introduction, body, and conclusion"
            className="min-h-[150px]"
            {...register("instructions", {
              required: "Instructions are required",
              minLength: { value: 20, message: "Please provide detailed instructions" },
            })}
          />
          {errors.instructions && <p className="text-sm text-red-500">{errors.instructions.message}</p>}
        </div>

        {/* FIX: The entire word limit input block has been removed */}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          <Plus className="w-4 h-4 mr-2" />
          {isSubmitting ? "Saving..." : "Save Writing Questions"}
        </Button>
      </form>
    </div>
  )
}