"use client"

import { Input } from "./ui/input"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { useToast } from "../hooks/use-toast"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Label } from "./ui/label"

interface ExamineeForm {
  name: string
  id: string
}

interface ExamineeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExamineeModal({ open, onOpenChange }: ExamineeModalProps) {
  const router = useRouter()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExamineeForm>()

  const onSubmit = (data: ExamineeForm) => {
    // Store examinee data
    localStorage.setItem("examineeName", data.name)
    localStorage.setItem("examineeId", data.id)

    // Create folder structure simulation
    const folderName = `${data.name}_${data.id}`
    const examineeFolder = {
      folderName,
      createdAt: new Date().toISOString(),
      examResults: {},
      activeExams: {},
    }

    // Store folder structure
    localStorage.setItem("examineeFolder", JSON.stringify(examineeFolder))
    localStorage.setItem("currentExaminee", folderName)

    toast({
      title: "Registration successful",
      description: `Welcome ${data.name}! Your exam folder has been created.`,
    })

    onOpenChange(false)
    reset()
    router.push("/examinee")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Examinee Registration</DialogTitle>
          <DialogDescription>Please enter your details to access the examination modules</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              {...register("name", {
                required: "Name is required",
                minLength: { value: 2, message: "Name must be at least 2 characters" },
              })}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="id">Student ID</Label>
            <Input
              id="id"
              placeholder="Enter your student ID"
              {...register("id", {
                required: "Student ID is required",
                pattern: {
                  value: /^[A-Za-z0-9]+$/,
                  message: "Student ID should contain only letters and numbers",
                },
              })}
            />
            {errors.id && <p className="text-sm text-red-500">{errors.id.message}</p>}
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Submit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
