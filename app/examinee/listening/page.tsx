"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { ArrowLeft, Headphones, Clock, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const getTotalQuestionCount = (question: any): number => {
    if (!question || !question.questions) return 0;
    try {
        const instructionGroups = JSON.parse(question.questions);
        if (!Array.isArray(instructionGroups)) return 0;

        return instructionGroups.reduce((total, group) => {
            return total + (group.questions?.length || 0);
        }, 0);
    } catch (e) {
        console.error("Failed to parse listening questions for count:", e);
        return 0;
    }
}

const getInstructionGroupCount = (question: any): number => {
    if (!question || !question.questions) return 0;
    try {
        const instructionGroups = JSON.parse(question.questions);
        return Array.isArray(instructionGroups) ? instructionGroups.length : 0;
    } catch (e) {
        return 0;
    }
}

export default function ListeningSelectionPage() {
  const { logout } = useAuth()
  const router = useRouter()
  const [listeningQuestions, setListeningQuestions] = useState<any[]>([])
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

    const loadQuestions = async () => {
      try {
        const response = await fetch("/api/listening-questions")
        if (response.ok) {
          const data = await response.json()
          const questions = Array.isArray(data) ? data : data.questions || []
          setListeningQuestions(questions)
        } else {
          console.error("Failed to load listening questions")
          setListeningQuestions([])
        }
      } catch (error) {
        console.error("Error loading listening questions:", error)
        setListeningQuestions([])
      }
    }

    loadQuestions()
  }, [router])

  const filteredQuestions = listeningQuestions.filter((question) => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesDate = true
    if (dateFilter !== "all") {
      const questionDate = new Date(question.created_at || Date.now())
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
    router.push(`/examinee/listening/exam/${questionId}`)
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

            <div className="mt-3 text-sm text-gray-600">
              Showing {filteredQuestions.length} of {listeningQuestions.length} exams
            </div>
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <Headphones className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {listeningQuestions.length === 0 ? "No Listening Exams Available" : "No Exams Found"}
              </h2>
              <p className="text-gray-600">
                {listeningQuestions.length === 0
                  ? "There are currently no listening exams available. Please contact your teacher."
                  : "Try adjusting your search terms or date filter to find more exams."}
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredQuestions.map((question) => {
                const totalQuestions = getTotalQuestionCount(question);
                const instructionGroupsCount = getInstructionGroupCount(question);
                const displayName = question.audio_filename || question.audio_url?.split('/').pop() || 'Audio file not specified';
                const audioSizeMB = (question.audio_size && typeof question.audio_size === 'number')
                  ? `(${(question.audio_size / 1024 / 1024).toFixed(2)} MB)`
                  : '';

                return (
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
                              An exam with {instructionGroupsCount} instruction group(s) and {totalQuestions} questions.
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
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded mt-1 truncate">
                            {displayName} {audioSizeMB}
                          </p>
                        </div>
                        <div className="flex justify-end">
                          <Button onClick={() => startExam(question.id)}>Start Exam</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}