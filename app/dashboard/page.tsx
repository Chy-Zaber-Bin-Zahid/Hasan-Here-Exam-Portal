"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { ExamineeModal } from "@/components/examinee-modal"
import { TeacherModal } from "@/components/teacher-modal"
import { LogOut, Users, GraduationCap } from "lucide-react"

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
              <h1 className="text-2xl font-bold text-gray-900">Exam Portal</h1>
              <Button variant="outline" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Exam Portal</h2>
            <p className="text-gray-600">Please select your role to continue</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Enter as Examinee</CardTitle>
                <CardDescription>Take your examination with proper identification</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => setShowExamineeModal(true)}>
                  Continue as Examinee
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Enter as Teacher</CardTitle>
                <CardDescription>Access admin dashboard to manage examinations</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline" onClick={() => setShowTeacherModal(true)}>
                  Continue as Teacher
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
