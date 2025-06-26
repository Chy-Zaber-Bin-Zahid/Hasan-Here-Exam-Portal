"use client"

import { Input } from "./ui/input";
import { Eye, EyeOff } from "lucide-react"; // Import icons
import { useRouter } from "next/navigation";
import { useState } from "react"; // Import useState
import { useForm } from "react-hook-form";
import { useToast } from "../hooks/use-toast";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";

interface TeacherForm {
  password: string
}

interface TeacherModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TeacherModal({ open, onOpenChange }: TeacherModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false); // Add state for password visibility

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TeacherForm>()

  const onSubmit = async (data: TeacherForm) => {
    try {
      const response = await fetch("/api/auth/teacher-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: data.password }),
      })

      if (response.ok) {
        toast({
          title: "Access granted",
          description: "Welcome to the teacher dashboard!",
        })
        onOpenChange(false)
        reset()
        router.push("/teacher")
      } else {
        toast({
          title: "Access denied",
          description: "Incorrect password. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Teacher Access</DialogTitle>
          <DialogDescription>Enter the teacher password to access the admin dashboard</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Teacher Password</Label>
            {/* FIX: Wrap Input and Icon in a relative container */}
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"} // Dynamic type
                placeholder="Enter teacher password"
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "Password must be at least 6 characters" },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Access Dashboard
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}