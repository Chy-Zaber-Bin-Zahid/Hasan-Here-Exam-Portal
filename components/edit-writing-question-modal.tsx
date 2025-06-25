"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Image as ImageIcon } from "lucide-react"

interface EditWritingForm {
    task1_prompt: string;
    task2_prompt: string;
    task2_instructions: string;
    new_image_file?: FileList;
}

interface EditWritingQuestionModalProps {
  question: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (question: any) => void
}

export function EditWritingQuestionModal({ question, open, onOpenChange, onSave }: EditWritingQuestionModalProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  
  const {
      register,
      handleSubmit,
      reset,
      watch,
      formState: { errors }
  } = useForm<EditWritingForm>();

  const newImageFile = watch("new_image_file")?.[0];
  const newImagePreviewUrl = newImageFile ? URL.createObjectURL(newImageFile) : null;

  useEffect(() => {
    if (question && open) {
        let prompts = { task1: "", task2: "" };
        let details = { task2: "", imageUrl: "" };
        try {
            if (question.prompt) prompts = JSON.parse(question.prompt);
            if (question.instructions) details = JSON.parse(question.instructions);
        } catch {}
      
        reset({
            task1_prompt: prompts.task1,
            task2_prompt: prompts.task2,
            task2_instructions: details.task2,
        });
        setCurrentImageUrl(details.imageUrl || "");
    }
  }, [question, open, reset]);

  const handleSave = async (data: EditWritingForm) => {
    setIsSaving(true);
    let finalImageUrl = currentImageUrl;
    let oldImageToDelete = null;

    if (data.new_image_file && data.new_image_file.length > 0) {
        const imageFile = data.new_image_file[0];
        const imageFormData = new FormData();
        imageFormData.append("image", imageFile);

        try {
            const uploadResponse = await fetch("/api/upload/image", {
                method: "POST",
                body: imageFormData,
            });
            const uploadResult = await uploadResponse.json();
            if (!uploadResponse.ok) throw new Error(uploadResult.error || "Image upload failed");

            finalImageUrl = uploadResult.path;
            if (currentImageUrl) {
                oldImageToDelete = currentImageUrl.split('/').pop();
            }

        } catch (error) {
            console.error("Image upload failed during edit:", error);
            toast({ title: "Upload Failed", description: "Could not save the new image.", variant: "destructive" });
            setIsSaving(false);
            return;
        }
    }

    const updatedQuestion = {
      ...question,
      // FIX: Use a clean, static title
      title: `Writing Exam (Task 1 & Task 2)`,
      prompt: JSON.stringify({
        task1: data.task1_prompt,
        task2: data.task2_prompt
      }),
      instructions: JSON.stringify({
        task2: data.task2_instructions,
        imageUrl: finalImageUrl
      }),
      old_image_to_delete: oldImageToDelete,
    };

    onSave(updatedQuestion);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Writing Question</DialogTitle>
          <DialogDescription>Update the details for both writing tasks.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
          <fieldset className="border p-4 rounded-md space-y-4">
            <legend className="px-2 font-semibold">Task 1 (Image & Prompt)</legend>
            <div>
              <Label>Current Image</Label>
              <div className="mt-2 p-2 border rounded-md bg-gray-50 flex justify-center">
                <img src={newImagePreviewUrl || currentImageUrl} alt="Task 1" className="max-h-48" />
              </div>
            </div>
             <div>
                <Label htmlFor="new_image_file">Upload New Image (Optional)</Label>
                <Input id="new_image_file" type="file" accept="image/*" {...register("new_image_file")} />
             </div>
             <div>
                <Label htmlFor="task1_prompt">Task 1 Prompt</Label>
                <Textarea id="task1_prompt" rows={4} {...register("task1_prompt", { required: true })} />
                {errors.task1_prompt && <p className="text-red-500 text-sm">Task 1 prompt is required.</p>}
             </div>
          </fieldset>
          
          <fieldset className="border p-4 rounded-md space-y-4">
             <legend className="px-2 font-semibold">Task 2 (Essay)</legend>
              <div>
                <Label htmlFor="task2_prompt">Task 2 Prompt</Label>
                <Textarea id="task2_prompt" rows={4} {...register("task2_prompt", { required: true })} />
                 {errors.task2_prompt && <p className="text-red-500 text-sm">Task 2 prompt is required.</p>}
             </div>
             <div>
                <Label htmlFor="task2_instructions">Task 2 Instructions</Label>
                <Textarea id="task2_instructions" rows={4} {...register("task2_instructions", { required: true })} />
                {errors.task2_instructions && <p className="text-red-500 text-sm">Task 2 instructions are required.</p>}
             </div>
          </fieldset>
          
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