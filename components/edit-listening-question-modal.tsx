"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useForm, useFieldArray, Control } from "react-hook-form"
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

interface InstructionGroup {
  instructionText: string;
  questions: Question[];
}

interface ListeningForm {
  title: string;
  instructionGroups: InstructionGroup[];
}

interface EditListeningQuestionModalProps {
  question: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (question: any) => void
}

export function EditListeningQuestionModal({ question, open, onOpenChange, onSave }: EditListeningQuestionModalProps) {
  const { toast } = useToast()
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<ListeningForm>();

  const { fields: instructionFields, append: appendInstruction, remove: removeInstruction } = useFieldArray({
    control,
    name: "instructionGroups",
  });


  useEffect(() => {
    if (question && open) {
      setAudioFile(null);
      setAudioPreviewUrl(question.audio_url || "");

      let parsedInstructionGroups: InstructionGroup[] = [];
      try {
        if (typeof question.questions === 'string') {
          parsedInstructionGroups = JSON.parse(question.questions);
        } else if (Array.isArray(question.questions)) {
          parsedInstructionGroups = question.questions;
        }
      } catch (error) {
        console.error("Error parsing questions for editing:", error);
        parsedInstructionGroups = [];
      }

      const sanitizedInstructionGroups = parsedInstructionGroups.map(group => ({
        instructionText: group.instructionText || '',
        questions: Array.isArray(group.questions) ? group.questions.map(q => ({ text: q.text || '' })) : [{ text: '' }]
      }));


      reset({
        title: question.title,
        instructionGroups: sanitizedInstructionGroups.length > 0 ? sanitizedInstructionGroups : [{ instructionText: "", questions: [{ text: "" }] }],
      });
    }
  }, [question, open, reset]);

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
        toast({ title: "Invalid file type", description: "Please select an audio file.", variant: "destructive" })
      }
    }
  }

  const handleSave = async (data: ListeningForm) => {
    if (!data.title.trim()) {
      toast({ title: "Validation Error", description: "Please enter a title.", variant: "destructive" })
      return
    }

    const validInstructionGroups = data.instructionGroups
      .map(group => ({
        ...group,
        questions: group.questions.filter(q => q.text.trim() !== "")
      }))
      .filter(group => group.instructionText.trim() !== "" && group.questions.length > 0);

    if (validInstructionGroups.length === 0) {
      toast({ title: "Validation Error", description: "Please add at least one instruction with one question.", variant: "destructive" })
      return
    }

    setIsSaving(true);
    let finalAudioUrl = question.audio_url;

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

        finalAudioUrl = result.path;

        toast({ title: "New Audio Uploaded", description: `File ${result.originalName} saved.` });

      } catch (error) {
        console.error("Upload error on save:", error);
        toast({ title: "Upload Failed", description: "Could not save the new audio file.", variant: "destructive" });
        setIsSaving(false);
        return;
      }
    }

    const updatedQuestion = {
      ...question,
      title: data.title.trim(),
      questions: JSON.stringify(validInstructionGroups),
      audio_url: finalAudioUrl,
      updatedAt: new Date().toISOString(),
    }

    onSave(updatedQuestion)
    setIsSaving(false);
    onOpenChange(false)
  }

  const getCurrentAudioDisplayName = () => {
    if (question.audio_url) {
      return question.audio_url.split('/').pop();
    }
    return 'No file';
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Listening Question Set</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} placeholder="Enter question set title" />
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
              <Label>Instructions & Questions</Label>
              <Button type="button" onClick={() => appendInstruction({ instructionText: '', questions: [{ text: '' }] })} variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" />Add Instruction</Button>
            </div>

            {instructionFields.map((item, instructionIndex) => (
              <div key={item.id} className="p-4 border rounded-md space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Instruction Group {instructionIndex + 1}</Label>
                  {instructionFields.length > 1 && <Button type="button" onClick={() => removeInstruction(instructionIndex)} variant="ghost" size="sm" className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></Button>}
                </div>
                <Textarea placeholder="Instruction text..." {...register(`instructionGroups.${instructionIndex}.instructionText`)} />
                <QuestionArray instructionIndex={instructionIndex} control={control} register={register} />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface QuestionArrayProps {
  instructionIndex: number;
  control: Control<ListeningForm>;
  register: any;
}
const QuestionArray = ({ instructionIndex, control, register }: QuestionArrayProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `instructionGroups.${instructionIndex}.questions`,
  });

  return (
    <div className="space-y-3 pl-6 border-l-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Questions</Label>
        <Button type="button" onClick={() => append({ text: "" })} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" /> Add Question
        </Button>
      </div>

      {fields.map((item, questionIndex) => (
        <div key={item.id} className="flex gap-2 items-start">
          <div className="flex-1">
            <Label htmlFor={`question-text-${questionIndex}`} className="sr-only">Question {questionIndex + 1}</Label>
            <Textarea id={`question-text-${questionIndex}`} placeholder={`Question ${questionIndex + 1}...`} className="min-h-[60px]" {...register(`instructionGroups.${instructionIndex}.questions.${questionIndex}.text`)} />
          </div>
          {fields.length > 1 && (
            <Button type="button" onClick={() => remove(questionIndex)} variant="ghost" size="icon" className="text-red-500 hover:text-red-700 shrink-0 mt-1">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};