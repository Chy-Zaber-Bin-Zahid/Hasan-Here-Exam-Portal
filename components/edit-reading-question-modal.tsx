"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus, X } from "lucide-react"
import { useEffect } from "react"

interface Question {
  text: string
}

interface ReadingForm {
  title: string
  passage: string
  questions: Question[]
}

interface EditReadingQuestionModalProps {
  question: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (question: any) => void
}

export function EditReadingQuestionModal({ question, open, onOpenChange, onSave }: EditReadingQuestionModalProps) {
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
      questions: [{ text: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  })

  useEffect(() => {
    if (question) {
      reset({
        title: question.title,
        passage: question.passage,
        questions: question.questions.length > 0 ? question.questions : [{ text: "" }],
      })
    }
  }, [question, reset])

  const onSubmit = (data: ReadingForm) => {
    const validQuestions = data.questions.filter((q) => q.text.trim() !== "")

    if (validQuestions.length === 0) {
      return
    }

    const updatedQuestion = {
      ...question,
      ...data,
      questions: validQuestions,
      updatedAt: new Date().toISOString(),
    }

    onSave(updatedQuestion)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Reading Question</DialogTitle>
          <DialogDescription>Update the reading passage and questions</DialogDescription>
        </DialogHeader>

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
                    {...register(`questions.${index}.text`)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
