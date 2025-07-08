"use client"

import type React from "react"
import { useForm, useFieldArray, Control } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useState, useRef } from "react"
import { Plus, Upload, X, Loader2 } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface Question {
  text: string
}

interface InstructionGroup {
  instructionText: string;
  questions: Question[];
}

interface ListeningForm {
  title: string
  instructionGroups: InstructionGroup[];
}

export function ListeningQuestionForm() {
  const { toast } = useToast()
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
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
      instructionGroups: [{ instructionText: "", questions: [{ text: "" }] }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "instructionGroups",
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

  const onSubmit = async (data: ListeningForm) => {
    if (!audioFile) {
      toast({ title: "Audio file required", description: "Please upload an audio file before saving.", variant: "destructive" })
      return
    }

    const validInstructionGroups = data.instructionGroups
      .map(group => ({
        ...group,
        questions: group.questions.filter(q => q.text.trim() !== "")
      }))
      .filter(group => group.instructionText.trim() !== "" && group.questions.length > 0);

    if (validInstructionGroups.length === 0) {
      toast({ title: "No questions provided", description: "Please add at least one instruction group with one question.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)

    try {
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

      const response = await fetch("/api/listening-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          audio_url: serverAudioPath,
          questions: JSON.stringify(validInstructionGroups),
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Listening questions saved",
          description: `The question set has been saved to the database successfully.`,
        })

        reset({ title: "", instructionGroups: [{ instructionText: "", questions: [{ text: "" }] }] });
        setAudioFile(null);
        setAudioUrl("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        throw new Error(result.error || "Failed to save questions")
      }
    } catch (error) {
      console.error("Save error:", error)
      toast({ title: "Save failed", description: "Failed to save to the database. Please try again.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
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
              <audio src={audioUrl} controls className="flex-1" />
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-md border p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <Label className="font-semibold">Instructions & Questions</Label>
            <Button type="button" onClick={() => append({ instructionText: "", questions: [{ text: "" }] })} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" /> Add Instruction Group
            </Button>
          </div>
          <Accordion type="multiple" defaultValue={["instruction-0"]} className="w-full space-y-4">
            {fields.map((item, index) => (
              <AccordionItem value={`instruction-${index}`} key={item.id} className="border rounded-lg bg-white shadow-sm">
                <AccordionTrigger className="px-6 py-4 text-lg hover:no-underline">
                  <div className="flex justify-between w-full items-center">
                    <span>Instruction Group {index + 1}</span>
                    {fields.length > 1 && (
                      <Button type="button" onClick={() => remove(index)} variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-0">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`instructionGroups.${index}.instructionText`}>Instruction Text</Label>
                      <Textarea
                        id={`instructionGroups.${index}.instructionText`}
                        placeholder="e.g., 'Listen to the conversation and answer questions 1-5.'"
                        {...register(`instructionGroups.${index}.instructionText` as const, { required: "Instruction text is required." })}
                      />
                    </div>
                    <QuestionArray control={control} instructionIndex={index} register={register} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>


        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isSubmitting ? "Saving..." : "Save Listening Questions"}
        </Button>
      </form>
    </div>
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
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500 min-w-[80px]">Question {questionIndex + 1}:</span>
              {fields.length > 1 && (
                <Button type="button" onClick={() => remove(questionIndex)} variant="ghost" size="sm" className="text-red-500 hover:text-red-700 p-1 h-auto">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Textarea
              placeholder={`Enter text for question ${questionIndex + 1} here...`}
              className="min-h-[60px]"
              {...register(`instructionGroups.${instructionIndex}.questions.${questionIndex}.text` as const)}
            />
          </div>
        </div>
      ))}
    </div>
  );
};