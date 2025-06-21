"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { ArrowLeft, PenTool, Clock, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function WritingSelectionPage() {
  const { logout } = useAuth()
  const router = useRouter()
  const [writingQuestions, setWritingQuestions] = useState<any[]>([])
  const [examineeName, setExamineeName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    const name = localStorage.getItem("examineeName")
    const id = localStorage.getItem("examineeId")

    if (!name || !id) {
      router.push("/dashboard")
      return
    }

    setExamineeName(name)

    // Load writing questions
    const questions = JSON.parse(localStorage.getItem("writingQuestions") || "[]")
    setWritingQuestions(questions)
  }, [router])

  const filteredQuestions = writingQuestions.filter((question) => {
    // Search filter
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase())

    // Date filter
    let matchesDate = true
    if (dateFilter !== "all") {
      const questionDate = new Date(question.createdAt || Date.now())
      const now = new Date()

      switch (dateFilter) {
        case "today":
          matchesDate = questionDate.toDateString() === now.toDateString()
          break
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = questionDate >= weekAgo
          break
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = questionDate >= monthAgo
          break
      }
    }

    return matchesSearch && matchesDate
  })

  const startExam = (questionId: number) => {
    // Create writing test folder structure
    const folderData = JSON.parse(localStorage.getItem("examineeFolder") || "{}")
    const currentTime = new Date().toISOString()

    folderData.activeExams = folderData.activeExams || {}
    folderData.activeExams.writing_test = {
      questionId,
      startTime: currentTime,
      status: "in_progress",
      createdAt: currentTime,
    }

    localStorage.setItem("examineeFolder", JSON.stringify(folderData))

    // Navigate to exam
    router.push(`/examinee/writing/exam/${questionId}`)
  }

  if (writingQuestions.length === 0) {
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
                  <h1 className="text-2xl font-bold text-gray-900">Writing Exams</h1>
                </div>
                <Button variant="outline" onClick={logout}>
                  Logout
                </Button>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <PenTool className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Writing Exams Available</h2>
              <p className="text-gray-600">
                There are currently no writing exams available. Please contact your teacher.
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
                <h1 className="text-2xl font-bold text-gray-900">Writing Exams</h1>
              </div>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Select a Writing Exam</h2>
            <p className="text-gray-600">Choose one of the available writing exams to begin</p>
          </div>

          {/* Search and Filter Controls */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search exams by title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Summary */}
            <div className="mt-3 text-sm text-gray-600">
              Showing {filteredQuestions.length} of {writingQuestions.length} exams
            </div>
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <PenTool className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {writingQuestions.length === 0 ? "No Writing Exams Available" : "No Exams Found"}
              </h2>
              <p className="text-gray-600">
                {writingQuestions.length === 0
                  ? "There are currently no writing exams available. Please contact your teacher."
                  : "Try adjusting your search terms or date filter to find more exams."}
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredQuestions.map((question) => (
                <Card key={question.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <PenTool className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{question.title}</CardTitle>
                          <CardDescription className="mt-1">
                            Writing examination with prompt and instructions
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
                        <p className="text-sm font-medium text-gray-700">Prompt Preview:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded mt-1">
                          {question.prompt.substring(0, 200)}...
                        </p>
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={() => startExam(question.id)}>Start Exam</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
