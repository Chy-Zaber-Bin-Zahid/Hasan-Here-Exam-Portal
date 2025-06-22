"use client"

import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

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
        headers: {
          "Content-Type": "application/json",
        },
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
            <Input
              id="password"
              type="password"
              placeholder="Enter teacher password"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Password must be at least 6 characters" },
              })}
            />
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
