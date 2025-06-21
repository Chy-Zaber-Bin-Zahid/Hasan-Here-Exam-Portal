"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Play, Pause, Volume2 } from "lucide-react"

interface EditListeningQuestionModalProps {
  question: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (question: any) => void
}

export function EditListeningQuestionModal({ question, open, onOpenChange, onSave }: EditListeningQuestionModalProps) {
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [questions, setQuestions] = useState<Array<{ text: string; options: string[]; correctAnswer: number }>>([])
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string>("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [keepOriginalAudio, setKeepOriginalAudio] = useState(true)

  useEffect(() => {
    if (question && open) {
      setTitle(question.title)
      setQuestions(question.questions || [])
      setAudioUrl(question.audioUrl || "")
      setKeepOriginalAudio(true)
      setAudioFile(null)
    }
  }, [question, open])

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type.startsWith("audio/")) {
        setAudioFile(file)
        setKeepOriginalAudio(false)
        const url = URL.createObjectURL(file)
        setAudioUrl(url)
        toast({
          title: "Audio uploaded",
          description: `${file.name} has been selected for upload.`,
        })
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an audio file.",
          variant: "destructive",
        })
      }
    }
  }

  const toggleAudio = () => {
    if (!audioUrl) return

    if (currentAudio) {
      if (isPlaying) {
        currentAudio.pause()
        setIsPlaying(false)
      } else {
        currentAudio.play()
        setIsPlaying(true)
      }
    } else {
      const audio = new Audio(audioUrl)
      audio.addEventListener("ended", () => setIsPlaying(false))
      audio.addEventListener("error", () => {
        toast({
          title: "Audio Error",
          description: "Could not play the audio file.",
          variant: "destructive",
        })
        setIsPlaying(false)
      })
      setCurrentAudio(audio)
      audio.play()
      setIsPlaying(true)
    }
  }

  const addQuestion = () => {
    setQuestions([...questions, { text: "", options: ["", "", "", ""], correctAnswer: 0 }])
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions]
    if (field === "text") {
      updated[index].text = value
    } else if (field === "correctAnswer") {
      updated[index].correctAnswer = value
    }
    setQuestions(updated)
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions]
    updated[questionIndex].options[optionIndex] = value
    setQuestions(updated)
  }

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a title.",
        variant: "destructive",
      })
      return
    }

    if (questions.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one question.",
        variant: "destructive",
      })
      return
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.text.trim()) {
        toast({
          title: "Validation Error",
          description: `Question ${i + 1} text is required.`,
          variant: "destructive",
        })
        return
      }
      if (q.options.some((opt) => !opt.trim())) {
        toast({
          title: "Validation Error",
          description: `All options for question ${i + 1} are required.`,
          variant: "destructive",
        })
        return
      }
    }

    const updatedQuestion = {
      ...question,
      title: title.trim(),
      questions,
      audioUrl: keepOriginalAudio ? question.audioUrl : audioUrl,
      audioFileName: keepOriginalAudio ? question.audioFileName : audioFile?.name || question.audioFileName,
      audioSize: keepOriginalAudio ? question.audioSize : audioFile?.size || question.audioSize,
      updatedAt: new Date().toISOString(),
    }

    onSave(updatedQuestion)
    onOpenChange(false)
  }

  const handleClose = () => {
    if (currentAudio) {
      currentAudio.pause()
      setCurrentAudio(null)
    }
    setIsPlaying(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Listening Question Set</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter question set title"
            />
          </div>

          {/* Audio Section */}
          <div className="space-y-4">
            <Label>Audio File</Label>

            {/* Current Audio Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">Current Audio:</p>
                  <p className="text-sm text-blue-700">{question?.audioFileName}</p>
                  <p className="text-xs text-blue-600">
                    {question?.audioSize ? `${(question.audioSize / 1024 / 1024).toFixed(2)} MB` : "Unknown size"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleAudio}
                  disabled={!audioUrl}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
              </div>
            </div>

            {/* New Audio Upload */}
            <div className="space-y-2">
              <Label htmlFor="audio-upload">Upload New Audio (Optional)</Label>
              <div className="flex items-center gap-4">
                <Input id="audio-upload" type="file" accept="audio/*" onChange={handleAudioUpload} className="flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setKeepOriginalAudio(true)}
                  className={keepOriginalAudio ? "bg-blue-100 border-blue-300" : ""}
                >
                  Keep Original
                </Button>
              </div>

              {audioFile && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-900">New Audio Selected:</p>
                      <p className="text-sm text-green-700">{audioFile.name}</p>
                      <p className="text-xs text-green-600">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleAudio}
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      <Volume2 className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Questions</Label>
              <Button type="button" onClick={addQuestion} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>

            {questions.map((question, qIndex) => (
              <Card key={qIndex}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Question {qIndex + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div>
                    <Label>Question Text</Label>
                    <Textarea
                      value={question.text}
                      onChange={(e) => updateQuestion(qIndex, "text", e.target.value)}
                      placeholder="Enter the question"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Answer Options</Label>
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={question.correctAnswer === oIndex}
                          onChange={() => updateQuestion(qIndex, "correctAnswer", oIndex)}
                          className="mt-1"
                        />
                        <Input
                          value={option}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          placeholder={`Option ${oIndex + 1}`}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {questions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No questions added yet. Click "Add Question" to get started.
              </div>
            )}
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
