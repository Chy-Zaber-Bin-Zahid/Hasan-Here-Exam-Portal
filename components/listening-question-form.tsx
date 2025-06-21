"use client"

import type React from "react"

import { useForm, useFieldArray } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useState, useRef } from "react"
import { Plus, Upload, Play, Pause, X } from "lucide-react"

interface Question {
  text: string
}

interface ListeningForm {
  title: string
  questions: Question[]
}

export function ListeningQuestionForm() {
  const { toast } = useToast()
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string>("")
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<ListeningForm>({
    defaultValues: {
      title: "",
      questions: [{ text: "" }], // Start with one empty question
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith("audio/")) {
        setAudioFile(file)
        const url = URL.createObjectURL(file)
        setAudioUrl(url)
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an audio file (MP3, WAV, etc.)",
          variant: "destructive",
        })
      }
    }
  }

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const onSubmit = (data: ListeningForm) => {
    if (!audioFile) {
      toast({
        title: "Audio file required",
        description: "Please upload an audio file before saving.",
        variant: "destructive",
      })
      return
    }

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

    // In a real app, you would upload the audio file to a server
    // For now, we'll store the file name and questions
    const existingQuestions = JSON.parse(localStorage.getItem("listeningQuestions") || "[]")
    const newQuestion = {
      ...data,
      questions: validQuestions,
      id: Date.now(),
      audioFileName: audioFile.name,
      audioSize: audioFile.size,
      createdAt: new Date().toISOString(),
    }

    const updatedQuestions = [...existingQuestions, newQuestion]
    localStorage.setItem("listeningQuestions", JSON.stringify(updatedQuestions))

    toast({
      title: "Listening questions saved",
      description: `The audio file with ${validQuestions.length} questions has been saved successfully.`,
    })

    reset({
      title: "",
      questions: [{ text: "" }],
    })
    setAudioFile(null)
    setAudioUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
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
            placeholder="Enter a title for this listening question set"
            {...register("title", { required: "Title is required" })}
          />
          {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="audio">Audio File</Label>
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Audio
            </Button>
            <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
            {audioFile && (
              <span className="text-sm text-gray-600">
                {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            )}
          </div>

          {audioUrl && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Button type="button" variant="ghost" size="sm" onClick={togglePlayPause}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="flex-1" controls />
            </div>
          )}
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

        <Button type="submit" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Save Listening Questions
        </Button>
      </form>
    </div>
  )
}
