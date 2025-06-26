"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { BookOpen, Loader2, Plus, X } from "lucide-react"
import { useState } from "react"
import { Control, useFieldArray, useForm } from "react-hook-form"
import { useToast } from "../hooks/use-toast"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { Separator } from "./ui/separator"

// Defines the structure for a single question
interface Question {
  text: string;
}

// Defines the structure for a group of questions under a single instruction
interface InstructionGroup {
  instructionText: string;
  questions: Question[];
}

// Defines the structure for a single passage, including its content and related instructions/questions
interface Passage {
  title: string;
  passage: string;
  instructionGroups: InstructionGroup[];
}

// Defines the overall structure for the entire reading exam form
interface ReadingForm {
  title: string; // The main title for the entire exam
  passages: Passage[]; // An array containing the three passages
}

export function ReadingQuestionForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize react-hook-form with the complex, nested data structure.
  const {
    register, // The register function is defined here
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<ReadingForm>({
    defaultValues: {
      title: "",
      passages: Array(3).fill({
        title: "",
        passage: "",
        instructionGroups: [{
          instructionText: "",
          questions: [{ text: "" }],
        }, ],
      }),
    },
  });

  // `useFieldArray` for managing the top-level passages array
  const { fields: passageFields } = useFieldArray({
    control,
    name: "passages",
  });

  // Handles form submission, data validation, and API call
  const onSubmit = async (data: ReadingForm) => {
    setIsSubmitting(true);

    // --- Data Validation ---
    if (!data.title.trim()) {
      toast({ title: "Validation Error", description: "The main exam title is required.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    // Validate each of the 3 passages
    for (let i = 0; i < data.passages.length; i++) {
      const passage = data.passages[i];
      if (!passage.title.trim() || !passage.passage.trim()) {
        toast({ title: "Validation Error", description: `Title and text for Passage ${i + 1} are required.`, variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      const validInstructionGroups = passage.instructionGroups
        .map(group => ({
            ...group,
            questions: group.questions.filter(q => q.text.trim() !== "")
        }))
        .filter(group => group.instructionText.trim() !== "" && group.questions.length > 0);


      if (validInstructionGroups.length === 0) {
        toast({ title: "Validation Error", description: `Passage ${i + 1} must have at least one instruction with one question.`, variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      // Replace with only the valid groups for submission
      data.passages[i].instructionGroups = validInstructionGroups;
    }

    try {
      const response = await fetch("/api/reading-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          passage: `This exam contains ${data.passages.length} passages. Full data is in the questions JSON.`,
          questions: JSON.stringify(data.passages),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Reading Exam Saved",
          description: `The exam "${data.title}" has been saved successfully.`,
        });
        reset();
      } else {
        throw new Error(result.error || "Failed to save the exam.");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "Save Failed", description: "Could not save the exam to the database. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-lg font-semibold">Main Exam Title</Label>
          <Input
            id="title"
            placeholder="e.g., 'IELTS Academic Reading Practice Test 1'"
            {...register("title", { required: "A main title for the exam is required." })}
          />
          {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
        </div>

        <Separator />

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
                    <Label htmlFor={`passages.${passageIndex}.title`}>Passage {passageIndex + 1} Title</Label>
                    <Input
                      id={`passages.${passageIndex}.title`}
                      placeholder={`Enter title for passage ${passageIndex + 1}`}
                      {...register(`passages.${passageIndex}.title`, { required: "Passage title is required." })}
                    />
                    {errors.passages?.[passageIndex]?.title && <p className="text-sm text-red-500">{errors.passages[passageIndex]?.title?.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`passages.${passageIndex}.passage`}>Passage {passageIndex + 1} Text</Label>
                    <Textarea
                      id={`passages.${passageIndex}.passage`}
                      placeholder={`Enter the full text for passage ${passageIndex + 1} here...`}
                      className="min-h-[250px]"
                      {...register(`passages.${passageIndex}.passage`, { required: "Passage text is required." })}
                    />
                    {errors.passages?.[passageIndex]?.passage && <p className="text-sm text-red-500">{errors.passages[passageIndex]?.passage?.message}</p>}
                  </div>

                  {/* FIX: Pass the `register` function down as a prop */}
                  <InstructionGroupArray control={control} passageIndex={passageIndex} register={register} />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <Button type="submit" className="w-full py-6 text-lg" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : <Plus className="w-6 h-6 mr-2" />}
          {isSubmitting ? "Saving Exam..." : "Save Entire Reading Exam"}
        </Button>
      </form>
    </div>
  );
}

// Define props to include the `register` function
interface InstructionGroupArrayProps {
  passageIndex: number;
  control: Control<ReadingForm>;
  register: any; // Pass register function
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
                  <X className="w-4 h-4" /> Remove Instruction
                </Button>
              )}
            </div>
            <Textarea
              id={`passages.${passageIndex}.instructionGroups.${instructionIndex}.instructionText`}
              placeholder="e.g., 'Choose the correct heading for paragraphs A-F...'"
              // FIX: Correctly register this field
              {...register(`passages.${passageIndex}.instructionGroups.${instructionIndex}.instructionText`)}
            />
            {/* FIX: Pass `register` down to the next level */}
            <QuestionArray passageIndex={passageIndex} instructionIndex={instructionIndex} control={control} register={register} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Define props to include the `register` function
interface QuestionArrayProps {
  passageIndex: number;
  instructionIndex: number;
  control: Control<ReadingForm>;
  register: any; // Pass register function
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
              // FIX: Correctly register this field
              {...register(`passages.${passageIndex}.instructionGroups.${instructionIndex}.questions.${questionIndex}.text`)}
            />
          </div>
        </div>
      ))}
    </div>
  );
};