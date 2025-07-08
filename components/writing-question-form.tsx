"use client"

import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Plus, Loader2, Image as ImageIcon, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"

// Defines the structure for the form fields
interface WritingForm {
    task1_prompt: string;
    task1_image: FileList;
    task2_prompt: string;
    task2_instructions: string;
}

export function WritingQuestionForm() {
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch
    } = useForm<WritingForm>();

    const selectedImage = watch("task1_image")?.[0];

    const onSubmit = async (data: WritingForm) => {
        setIsSubmitting(true);
        const imageFile = data.task1_image[0];

        if (!imageFile) {
            toast({ title: "Validation Error", description: "An image for Task 1 is required.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }

        try {
            // Step 1: Upload the image and get its URL
            const imageFormData = new FormData();
            imageFormData.append("image", imageFile);

            const uploadResponse = await fetch("/api/upload/image", {
                method: "POST",
                body: imageFormData,
            });

            const uploadResult = await uploadResponse.json();
            if (!uploadResponse.ok) {
                throw new Error(uploadResult.error || 'Image upload failed');
            }
            const imageUrl = uploadResult.path;

            // Step 2: Save the question data with the image URL
            const questionPayload = {
                // FIX: Use a clean, static title as one is not provided in the form
                title: `Writing Exam (Task 1 & Task 2)`,
                prompt: JSON.stringify({
                    task1: data.task1_prompt,
                    task2: data.task2_prompt
                }),
                instructions: JSON.stringify({
                    task2: data.task2_instructions,
                    imageUrl: imageUrl
                }),
                word_limit: 0
            };
            
            const questionResponse = await fetch("/api/writing-questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(questionPayload),
            });

            const questionResult = await questionResponse.json();
            if (!questionResponse.ok) {
                throw new Error(questionResult.error || "Failed to save question data.");
            }

            toast({
                title: "Writing Exam Saved",
                description: "The two tasks have been saved successfully.",
            });
            reset();
        } catch (error) {
            console.error("Save error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                title: "Save Failed",
                description: `Failed to save the writing exam. ${errorMessage}`,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        <Card className="border-blue-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800"><ImageIcon className="h-6 w-6"/>Task 1</CardTitle>
                <CardDescription>This task requires an image (e.g., graph, chart, diagram) and a prompt.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="task1_image">Task 1 Image (Mandatory)</Label>
                    <Input
                        id="task1_image"
                        type="file"
                        accept="image/png, image/jpeg, image/gif, image/webp"
                        {...register("task1_image", { required: "An image for Task 1 is required."})}
                    />
                    {errors.task1_image && <p className="text-sm text-red-500">{errors.task1_image.message}</p>}
                    {selectedImage && <p className="text-sm text-muted-foreground mt-2">Selected: {selectedImage.name}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="task1_prompt">Task 1 Prompt</Label>
                    <Textarea
                        id="task1_prompt"
                        placeholder="e.g., 'The chart below shows the changes in three different areas of crime in Manchester city centre from 2003-2012. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.'"
                        className="min-h-[100px]"
                        {...register("task1_prompt", { required: "Task 1 prompt is required." })}
                    />
                    {errors.task1_prompt && <p className="text-sm text-red-500">{errors.task1_prompt.message}</p>}
                </div>
            </CardContent>
        </Card>
        
         <Card className="border-green-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800"><FileText className="h-6 w-6" />Task 2</CardTitle>
                <CardDescription>This task is typically an essay question.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="task2_prompt">Task 2 Prompt</Label>
                    <Textarea
                        id="task2_prompt"
                        placeholder="e.g., 'Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?'"
                        className="min-h-[100px]"
                        {...register("task2_prompt", { required: "Task 2 prompt is required." })}
                    />
                    {errors.task2_prompt && <p className="text-sm text-red-500">{errors.task2_prompt.message}</p>}
                </div>

                 <div className="space-y-2">
                    <Label htmlFor="task2_instructions">Task 2 Instructions</Label>
                    <Textarea
                        id="task2_instructions"
                        placeholder="e.g., 'Write at least 250 words. You should spend about 40 minutes on this task. Give reasons for your answer and include any relevant examples from your own knowledge or experience.'"
                        className="min-h-[80px]"
                        {...register("task2_instructions", { required: "Task 2 instructions are required." })}
                    />
                    {errors.task2_instructions && <p className="text-sm text-red-500">{errors.task2_instructions.message}</p>}
                </div>
            </CardContent>
        </Card>

        <Button type="submit" className="w-full py-6 text-lg" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : <Plus className="w-6 h-6 mr-2" />}
          {isSubmitting ? "Saving Exam..." : "Save Writing Exam (Both Tasks)"}
        </Button>
      </form>
    </div>
  )
}