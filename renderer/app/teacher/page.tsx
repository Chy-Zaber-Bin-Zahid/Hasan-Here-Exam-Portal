"use client"

import { ArrowLeft, FileCheck, Plus, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../components/auth-provider"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { ProtectedRoute } from "../../components/protected-route"

export default function TeacherPage() {
  const { logout } = useAuth()
  const router = useRouter()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
              </div>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Question & Submission Management</h2>
            <p className="text-gray-600">Create new questions, manage existing ones, or view student submissions.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* FIX: Added flexbox classes to align content */}
            <Card className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/teacher/create")}>
              <CardHeader className="flex-grow text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Create Questions</CardTitle>
                <CardDescription>Add new questions for Reading, Listening, and Writing sections</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Create New Questions
                </Button>
              </CardContent>
            </Card>

            <Card className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/teacher/manage")}>
              <CardHeader className="flex-grow text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Settings className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Manage Questions</CardTitle>
                <CardDescription>Edit, delete, or view existing question sets</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Manage Questions
                </Button>
              </CardContent>
            </Card>

            <Card className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/teacher/submissions")}>
              <CardHeader className="flex-grow text-center">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <FileCheck className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">View Submissions</CardTitle>
                <CardDescription>Review and manage examinee exam submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  View Submissions
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}