"use client"

import { useForm, useFieldArray, Control } from "react-hook-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus, X, Loader2, BookOpen } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

// --- Interfaces for form structure ---
interface Question {
  text: string;
}
interface InstructionGroup {
  instructionText: string;
  questions: Question[];
}
interface Passage {
  title: string;
  passage: string;
  instructionGroups: InstructionGroup[];
}
interface ReadingForm {
  title: string;
  passages: Passage[];
}

// --- Component Props ---
interface EditReadingQuestionModalProps {
  question: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (question: any) => void
}

export function EditReadingQuestionModal({ question, open, onOpenChange, onSave }: EditReadingQuestionModalProps) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        control,
    } = useForm<ReadingForm>();

    const { fields: passageFields } = useFieldArray({
        control,
        name: "passages",
    });

  // When the modal opens, parse the existing question data and populate the form fields
  useEffect(() => {
    if (question && open) {
      let parsedPassages = [];
      try {
        if (typeof question.questions === "string") {
          parsedPassages = JSON.parse(question.questions);
        } else if (Array.isArray(question.questions)) {
          parsedPassages = question.questions;
        }
      } catch (error) {
        console.error("Error parsing reading passages for edit:", error);
        toast({ title: "Error", description: "Could not parse existing question data.", variant: "destructive" });
      }

      reset({
        title: question.title,
        passages: parsedPassages.length > 0 ? parsedPassages : Array(3).fill({ // Fallback
            title: "",
            passage: "",
            instructionGroups: [{ instructionText: "", questions: [{ text: "" }] }],
        }),
      });
    }
  }, [question, open, reset, toast]);

  const onSubmit = (data: ReadingForm) => {
    setIsSaving(true);
    // Basic validation
     if (!data.title.trim()) {
      toast({ title: "Validation Error", description: "The main exam title is required.", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    const updatedQuestion = {
      ...question,
      title: data.title,
      // Re-stringify the potentially modified passage structure for saving
      questions: JSON.stringify(data.passages),
      updatedAt: new Date().toISOString(),
    };
    
    onSave(updatedQuestion);
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Reading Exam</DialogTitle>
          <DialogDescription>Update the title, passages, instructions, and questions for this exam.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-semibold">Main Exam Title</Label>
                <Input
                    id="title"
                    placeholder="Enter the main title for the exam"
                    {...register("title", { required: "Title is required" })}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <Accordion type="multiple" defaultValue={["passage-0"]} className="w-full space-y-4">
                 {passageFields.map((passageItem, passageIndex) => (
                    <AccordionItem value={`passage-${passageIndex}`} key={passageItem.id} className="border rounded-lg bg-white shadow-sm">
                        <AccordionTrigger className="px-6 py-4 text-lg hover:no-underline">
                            <div className="flex items-center gap-3">
                                <BookOpen className="w-6 h-6 text-blue-600" />
                                <span>Passage {passageIndex + 1}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6 pt-0">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor={`passages.${passageIndex}.title`}>Passage Title</Label>
                                    <Input {...register(`passages.${passageIndex}.title`, { required: "Title is required" })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`passages.${passageIndex}.passage`}>Passage Text</Label>
                                    <Textarea className="min-h-[200px]" {...register(`passages.${passageIndex}.passage`, { required: "Passage text is required" })} />
                                </div>
                                <InstructionGroupArray control={control} passageIndex={passageIndex} register={register} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                 ))}
            </Accordion>

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

// --- Sub-components for handling nested arrays (identical to creation form) ---
interface InstructionGroupArrayProps {
  passageIndex: number;
  control: Control<ReadingForm>;
  register: any;
}
const InstructionGroupArray = ({ passageIndex, control, register }: InstructionGroupArrayProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `passages.${passageIndex}.instructionGroups`,
  });
  return (
    <div className="space-y-4 rounded-md border p-4 bg-gray-50">
      <div className="flex justify-between items-center">
        <Label className="font-semibold">Instructions & Questions</Label>
        <Button type="button" onClick={() => append({ instructionText: "", questions: [{ text: "" }] })} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" /> Add Instruction
        </Button>
      </div>
      <div className="space-y-4">
        {fields.map((item, instructionIndex) => (
          <div key={item.id} className="space-y-3 rounded-md border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <Label htmlFor={`passages.${passageIndex}.instructionGroups.${instructionIndex}.instructionText`}>Instruction {instructionIndex + 1}</Label>
              {fields.length > 1 && (
                <Button type="button" onClick={() => remove(instructionIndex)} variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Textarea placeholder="Instruction text..." {...register(`passages.${passageIndex}.instructionGroups.${instructionIndex}.instructionText`)} />
            <QuestionArray passageIndex={passageIndex} instructionIndex={instructionIndex} control={control} register={register} />
          </div>
        ))}
      </div>
    </div>
  );
};

interface QuestionArrayProps {
  passageIndex: number;
  instructionIndex: number;
  control: Control<ReadingForm>;
  register: any;
}
const QuestionArray = ({ passageIndex, instructionIndex, control, register }: QuestionArrayProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `passages.${passageIndex}.instructionGroups.${instructionIndex}.questions`,
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
             <Textarea id={`question-text-${questionIndex}`} placeholder={`Question ${questionIndex + 1}...`} className="min-h-[60px]" {...register(`passages.${passageIndex}.instructionGroups.${instructionIndex}.questions.${questionIndex}.text`)} />
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