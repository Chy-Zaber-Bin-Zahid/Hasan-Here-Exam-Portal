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
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedAudioPath, setUploadedAudioPath] = useState<string>("")
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith("audio/")) {
        setAudioFile(file)
        const url = URL.createObjectURL(file)
        setAudioUrl(url)

        // Upload the audio file to server
        setIsUploading(true)
        try {
          const formData = new FormData()
          formData.append("audio", file)

          const response = await fetch("/api/upload/audio", {
            method: "POST",
            body: formData,
          })

          const result = await response.json()

          if (result.success) {
            setUploadedAudioPath(result.path)
            toast({
              title: "Audio uploaded successfully",
              description: `File ${result.originalName} has been uploaded.`,
            })
          } else {
            throw new Error(result.error)
          }
        } catch (error) {
          console.error("Upload error:", error)
          toast({
            title: "Upload failed",
            description: "Failed to upload audio file. Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsUploading(false)
        }
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

  const onSubmit = async (data: ListeningForm) => {
    if (!audioFile || !uploadedAudioPath) {
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

    setIsSubmitting(true)

    try {
      // Save to database via API
      const response = await fetch("/api/listening-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          audio_url: uploadedAudioPath,
          text: "", // Empty for now, can be added later if needed
          questions: JSON.stringify(validQuestions),
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Listening questions saved",
          description: `The audio file with ${validQuestions.length} questions has been saved to database successfully.`,
        })

        reset({
          title: "",
          questions: [{ text: "" }],
        })
        setAudioFile(null)
        setAudioUrl("")
        setUploadedAudioPath("")
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        throw new Error(result.error || "Failed to save questions")
      }
    } catch (error) {
      console.error("Save error:", error)
      toast({
        title: "Save failed",
        description: "Failed to save listening questions to database. Please try again.",
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
              disabled={isUploading}
            >
              <Upload className="w-4 h-4" />
              {isUploading ? "Uploading..." : "Upload Audio"}
            </Button>
            <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
            {audioFile && (
              <span className="text-sm text-gray-600">
                {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                {uploadedAudioPath && <span className="text-green-600 ml-2">✓ Uploaded</span>}
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

        <Button type="submit" className="w-full" disabled={isUploading || isSubmitting}>
          <Plus className="w-4 h-4 mr-2" />
          {isSubmitting ? "Saving..." : "Save Listening Questions"}
        </Button>
      </form>
    </div>
  )
}
