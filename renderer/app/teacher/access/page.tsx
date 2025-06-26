"use client"

import { Eye, EyeOff } from "lucide-react"; // Import icons
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../../components/auth-provider";
import { useToast } from "../../../hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";

interface AccessForm {
  password: string
}

export default function TeacherAccessPage() {
  const { verifyTeacherAccess } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false) // Add state for password visibility

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
              {/* FIX: Wrap Input and Icon in a relative container */}
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"} // Dynamic type
                  placeholder="Enter teacher access password"
                  {...register("password", { required: "Password is required" })}
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Access Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}