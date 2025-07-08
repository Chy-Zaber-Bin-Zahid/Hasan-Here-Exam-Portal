"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff } from "lucide-react" // Import icons

interface LoginForm {
  username: string
  password: string
}

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false) // Add state for password visibility

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>()

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    const success = await login(data.username, data.password)
    if (success) {
      toast({
        title: "Login successful",
        description: "Welcome to the exam portal!",
      })
      router.push("/dashboard")
    } else {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      })
    }
    setIsLoading(false)
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Exam Portal</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access the portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                {...register("username", { required: "Username is required" })}
              />
              {errors.username && <p className="text-sm text-red-500">{errors.username.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              {/* FIX: Wrap Input and Icon in a relative container */}
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"} // Dynamic type
                  placeholder="Enter password"
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
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}