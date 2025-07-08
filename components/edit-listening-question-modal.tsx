"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Plus, X, Loader2 } from "lucide-react"

interface Question {
  text: string;
}

interface EditListeningQuestionModalProps {
  question: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (question: any) => void
}

export function EditListeningQuestionModal({ question, open, onOpenChange, onSave }: EditListeningQuestionModalProps) {
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (question && open) {
      setTitle(question.title);
      setAudioFile(null);
      setAudioPreviewUrl(question.audio_url || "");

      let parsedQuestions: Question[] = [];
      try {
        if (typeof question.questions === 'string') {
          parsedQuestions = JSON.parse(question.questions);
        } else if (Array.isArray(question.questions)) {
          parsedQuestions = question.questions;
        }
      } catch (error) {
        console.error("Error parsing questions for editing:", error);
        parsedQuestions = [];
      }
      
      const sanitizedQuestions = parsedQuestions.map(q => ({ text: q.text || '' }));
      setQuestions(sanitizedQuestions.length > 0 ? sanitizedQuestions : [{ text: "" }]);
    }
  }, [question, open]);
  
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.load();
    }
  }, [audioPreviewUrl])

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type.startsWith("audio/")) {
        setAudioFile(file);
        const localUrl = URL.createObjectURL(file);
        setAudioPreviewUrl(localUrl);
      } else {
        toast({ title: "Invalid file type", description: "Please select an audio file.", variant: "destructive"})
      }
    }
  }

  const addQuestion = () => {
    setQuestions([...questions, { text: "" }])
  }

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    } else {
      toast({
        title: "Cannot Delete",
        description: "At least one question is required.",
        variant: "destructive",
      });
    }
  };

  const updateQuestionText = (index: number, value: string) => {
    const updated = [...questions]
    updated[index].text = value
    setQuestions(updated)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Validation Error", description: "Please enter a title.", variant: "destructive" })
      return
    }

    const validQuestions = questions.filter((q) => q.text.trim() !== "");
    if (validQuestions.length === 0) {
      toast({ title: "Validation Error", description: "Please add at least one question.", variant: "destructive"})
      return
    }
    
    setIsSaving(true);
    let finalAudioUrl = question.audio_url;
    let finalAudioFilename = question.audio_filename;
    let finalAudioSize = question.audio_size;
    let oldAudioUrlToDelete = null;
    
    if (audioFile) {
        try {
            const formData = new FormData();
            formData.append("audio", audioFile);
            
            const response = await fetch("/api/upload/audio", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Upload failed');
            
            const newServerPath = result.path;
            
            if (newServerPath !== question.audio_url) {
                finalAudioUrl = newServerPath;
                finalAudioFilename = audioFile.name;
                finalAudioSize = audioFile.size;
                oldAudioUrlToDelete = question.audio_url; 
            }
            
            toast({ title: "New Audio Uploaded", description: `File ${result.originalName} saved.`});

        } catch (error) {
            console.error("Upload error on save:", error);
            toast({ title: "Upload Failed", description: "Could not save the new audio file.", variant: "destructive" });
            setIsSaving(false);
            return;
        }
    }

    const updatedQuestion = {
      ...question,
      title: title.trim(),
      questions: JSON.stringify(validQuestions),
      audio_url: finalAudioUrl,
      audio_filename: finalAudioFilename,
      audio_size: finalAudioSize,
      old_audio_url_to_delete: oldAudioUrlToDelete,
      updatedAt: new Date().toISOString(),
    }

    onSave(updatedQuestion)
    setIsSaving(false);
    onOpenChange(false)
  }

  // FIX: Create a helper to safely get the display name for the audio file
  const getCurrentAudioDisplayName = () => {
    // Prioritize the explicitly stored original filename
    if (question.audio_filename) {
      return question.audio_filename;
    }
    // Fallback for older records: extract from the URL
    if (question.audio_url) {
      return question.audio_url.split('/').pop();
    }
    // If no data is available
    return 'No file';
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Listening Question Set</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter question set title" />
          </div>

          <div className="space-y-4">
            <Label>Audio File</Label>
             <div className="p-4 bg-gray-100 border rounded-lg">
                <p className="font-medium text-gray-800">Audio Preview</p>
                <p className="text-sm text-gray-500 mb-2 truncate">
                    {audioFile ? `New: ${audioFile.name}` : `Current: ${getCurrentAudioDisplayName()}`}
                </p>
                {audioPreviewUrl ? (
                    <audio ref={audioRef} key={audioPreviewUrl} controls src={audioPreviewUrl} className="w-full" />
                ) : <p className="text-sm text-gray-500">No audio available for preview.</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="audio-upload">Upload New Audio to Replace</Label>
              <Input id="audio-upload" type="file" accept="audio/*" onChange={handleAudioUpload} className="flex-1" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Questions</Label>
              <Button type="button" onClick={addQuestion} variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" />Add Question</Button>
            </div>
            
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 min-w-[80px]">Question {qIndex + 1}:</span>
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 p-1 h-auto"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    placeholder={`Enter question ${qIndex + 1} here...`}
                    className="min-h-[80px]"
                    value={q.text}
                    onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}