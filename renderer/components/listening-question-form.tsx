"use client"

import type React from "react"

import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Loader2, Plus, Upload, X } from "lucide-react"
import { useRef, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { useToast } from "../hooks/use-toast"
import { Button } from "./ui/button"
import { Label } from "./ui/label"

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
  const [isSubmitting, setIsSubmitting] = useState(false)
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
      questions: [{ text: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  })

  // FIX: Reverted to only setting file state, not uploading immediately.
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
    }
  }

  // FIX: Reverted to include the upload logic inside the final save handler.
  const onSubmit = async (data: ListeningForm) => {
    if (!audioFile) {
      toast({ title: "Audio file required", description: "Please upload an audio file before saving.", variant: "destructive" })
      return
    }

    const validQuestions = data.questions.filter((q) => q.text.trim() !== "");
    if (validQuestions.length === 0) {
      toast({ title: "No questions provided", description: "Please add at least one question.", variant: "destructive"})
      return
    }

    setIsSubmitting(true)

    try {
      // Step 1: Upload the audio file to get the server path
      const formData = new FormData()
      formData.append("audio", audioFile)
      const uploadResponse = await fetch("/api/upload/audio", {
        method: "POST",
        body: formData,
      });
      const uploadResult = await uploadResponse.json();
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Failed to upload audio");
      }
      
      const serverAudioPath = uploadResult.path;

      // Step 2: Save the question data with the new audio path
      const response = await fetch("/api/listening-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          audio_url: serverAudioPath,
          audio_filename: audioFile.name,
          audio_size: audioFile.size,
          text: "", 
          questions: JSON.stringify(validQuestions),
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Listening questions saved",
          description: `The question set has been saved to the database successfully.`,
        })

        reset({ title: "", questions: [{ text: "" }]});
        setAudioFile(null);
        setAudioUrl("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        throw new Error(result.error || "Failed to save questions")
      }
    } catch (error) {
      console.error("Save error:", error)
      toast({ title: "Save failed", description: "Failed to save to the database. Please try again.", variant: "destructive"})
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
          <Input id="title" placeholder="Enter a title for this listening question set" {...register("title", { required: "Title is required" })} />
          {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="audio">Audio File</Label>
          <div className="flex items-center gap-4">
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2" disabled={isSubmitting}>
              <Upload className="w-4 h-4" />
              Choose Audio
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
              <audio ref={audioRef} src={audioUrl} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} className="flex-1" controls />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Questions</Label>
            <Button type="button" onClick={addQuestion} variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" />Add Question</Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 min-w-[80px]">Question {index + 1}:</span>
                  {fields.length > 1 && (
                    <Button type="button" onClick={() => removeQuestion(index)} variant="ghost" size="sm" className="text-red-500 hover:text-red-700 p-1 h-auto">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <Textarea placeholder={`Enter question ${index + 1} here...`} className="min-h-[80px]" {...register(`questions.${index}.text`)} />
              </div>
            </div>
          ))}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isSubmitting ? "Saving..." : "Save Listening Questions"}
        </Button>
      </form>
    </div>
  )
}