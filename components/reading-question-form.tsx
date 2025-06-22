"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Plus, X } from "lucide-react"

interface Question {
  text: string
}

interface ReadingForm {
  title: string
  passage: string
  questions: Question[]
}

export function ReadingQuestionForm() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<ReadingForm>({
    defaultValues: {
      title: "",
      passage: "",
      questions: [{ text: "" }], // Start with one empty question
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  })

  const onSubmit = async (data: ReadingForm) => {
    // Filter out empty questions
    const validQuestions = data.questions.filter((q) => q.text.trim() !== "")

    if (validQuestions.length === 0) {
      toast({
        title: "No questions provided",
        description: "Please add at least one question.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Save to database via API
      const response = await fetch("/api/reading-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          passage: data.passage,
          questions: JSON.stringify(validQuestions),
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Reading questions saved",
          description: `The reading passage with ${validQuestions.length} questions has been saved to database successfully.`,
        })

        reset({
          title: "",
          passage: "",
          questions: [{ text: "" }],
        })
      } else {
        throw new Error(result.error || "Failed to save questions")
      }
    } catch (error) {
      console.error("Save error:", error)
      toast({
        title: "Save failed",
        description: "Failed to save reading questions to database. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addQuestion = () => {
    append({ text: "" })
  }

  const removeQuestion = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Question Set Title</Label>
          <Input
            id="title"
            placeholder="Enter a title for this reading question set"
            {...register("title", { required: "Title is required" })}
          />
          {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="passage">Reading Passage</Label>
          <Textarea
            id="passage"
            placeholder="Enter the reading passage here..."
            className="min-h-[200px]"
            {...register("passage", {
              required: "Reading passage is required",
              minLength: { value: 50, message: "Passage should be at least 50 characters long" },
            })}
          />
          {errors.passage && <p className="text-sm text-red-500">{errors.passage.message}</p>}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Questions</Label>
            <Button type="button" onClick={addQuestion} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 min-w-[80px]">Question {index + 1}:</span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 p-1 h-auto"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <Textarea
                  placeholder={`Enter question ${index + 1} here...`}
                  className="min-h-[80px]"
                  {...register(`questions.${index}.text`, {
                    required: false, // We'll filter empty ones in onSubmit
                  })}
                />
              </div>
            </div>
          ))}

          {errors.questions && <p className="text-sm text-red-500">Please add at least one question.</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          <Plus className="w-4 h-4 mr-2" />
          {isSubmitting ? "Saving..." : "Save Reading Questions"}
        </Button>
      </form>
    </div>
  )
}
