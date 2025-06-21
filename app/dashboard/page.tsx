"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap } from "lucide-react"
import { useRouter } from "next/navigation"

const DashboardPage = () => {
  const router = useRouter()

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to the Dashboard</CardTitle>
          <CardDescription>Choose your role below.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button onClick={() => router.push("/student")} className="w-full h-24 text-lg">
            Student Dashboard
          </Button>

          {/* Change the teacher dashboard link */}
          <Button onClick={() => router.push("/teacher/access")} className="w-full h-24 text-lg">
            <GraduationCap className="mr-2 h-6 w-6" />
            Teacher Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardPage
