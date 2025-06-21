"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { ArrowLeft, Headphones, Clock } from "lucide-react"

export default function ListeningSelectionPage() {
  const { logout } = useAuth()
  const router = useRouter()
  const [listeningQuestions, setListeningQuestions] = useState<any[]>([])
  const [examineeName, setExamineeName] = useState("")

  useEffect(() => {
    const name = localStorage.getItem("examineeName")
    const id = localStorage.getItem("examineeId")

    if (!name || !id) {
      router.push("/dashboard")
      return
    }

    setExamineeName(name)

    // Load listening questions
    const questions = JSON.parse(localStorage.getItem("listeningQuestions") || "[]")
    setListeningQuestions(questions)
  }, [router])

  const startExam = (questionId: number) => {
    // Create listening test folder structure
    const folderData = JSON.parse(localStorage.getItem("examineeFolder") || "{}")
    const currentTime = new Date().toISOString()

    folderData.activeExams = folderData.activeExams || {}
    folderData.activeExams.listening_test = {
      questionId,
      startTime: currentTime,
      status: "in_progress",
      createdAt: currentTime,
    }

    localStorage.setItem("examineeFolder", JSON.stringify(folderData))

    // Navigate to exam
    router.push(`/examinee/listening/exam/${questionId}`)
  }

  if (listeningQuestions.length === 0) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" onClick={() => router.push("/examinee")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <h1 className="text-2xl font-bold text-gray-900">Listening Exams</h1>
                </div>
                <Button variant="outline" onClick={logout}>
                  Logout
                </Button>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <Headphones className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Listening Exams Available</h2>
              <p className="text-gray-600">
                There are currently no listening exams available. Please contact your teacher.
              </p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.push("/examinee")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">Listening Exams</h1>
              </div>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Select a Listening Exam</h2>
            <p className="text-gray-600">Choose one of the available listening exams to begin</p>
          </div>

          <div className="grid gap-6">
            {listeningQuestions.map((question) => (
              <Card key={question.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Headphones className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{question.title}</CardTitle>
                        <CardDescription className="mt-1">
                          Listening comprehension with {question.questions.length} questions
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      60 minutes
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Audio File:</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded mt-1">
                        {question.audioFileName} ({(question.audioSize / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Questions: {question.questions.length}</p>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={() => startExam(question.id)}>Start Exam</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
