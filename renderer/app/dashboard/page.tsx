"use client"

import { GraduationCap, Users } from "lucide-react"
import { useState } from "react"
import { useAuth } from "../../components/auth-provider"
import { ProtectedRoute } from "../../components/protected-route"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { ExamineeModal } from "../../components/examinee-modal"
import { TeacherModal } from "../../components/teacher-modal"

export default function DashboardPage() {
  const { logout } = useAuth()
  const [showExamineeModal, setShowExamineeModal] = useState(false)
  const [showTeacherModal, setShowTeacherModal] = useState(false)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">Exam Portal Dashboard</h1>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to the Exam Portal</h2>
            <p className="text-gray-600">Select your role to continue</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* FIX: Added flex and flex-col to make the card a flex container */}
            <Card className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer">
              {/* FIX: Added flex-grow to make the header expand and push the content down */}
              <CardHeader className="flex-grow text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Examinee</CardTitle>
                <CardDescription>Take exams in Reading, Listening, and Writing modules</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => setShowExamineeModal(true)}>
                  Select Examinee
                </Button>
              </CardContent>
            </Card>

            {/* FIX: Applied the same flex properties to the second card for consistency */}
            <Card className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex-grow text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <GraduationCap className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Teacher</CardTitle>
                <CardDescription>Create and manage exam questions and monitor student progress</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => setShowTeacherModal(true)}>
                  Select Teacher
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>

        <ExamineeModal open={showExamineeModal} onOpenChange={setShowExamineeModal} />
        <TeacherModal open={showTeacherModal} onOpenChange={setShowTeacherModal} />
      </div>
    </ProtectedRoute>
  )
}