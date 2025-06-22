"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

interface AccessForm {
  password: string
}

export default function TeacherAccessPage() {
  const { verifyTeacherAccess } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccessForm>()

  const onSubmit = async (data: AccessForm) => {
    setIsLoading(true)

    const success = await verifyTeacherAccess(data.password)

    if (success) {
      toast({
        title: "Access granted",
        description: "Welcome to teacher dashboard!",
      })
      router.push("/teacher")
    } else {
      toast({
        title: "Access denied",
        description: "Invalid teacher access password",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Teacher Access</CardTitle>
          <CardDescription className="text-center">Enter teacher access password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Access Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter teacher access password"
                {...register("password", { required: "Password is required" })}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Access Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
