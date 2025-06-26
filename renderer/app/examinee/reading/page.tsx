"use client"

import { ArrowLeft, BookOpen, Clock, Filter, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "../../../components/auth-provider"
import { ProtectedRoute } from "../../../components/protected-route"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"

// Helper function to correctly count questions from the new nested structure
const getTotalQuestionCount = (question: any): number => {
    if (!question || !question.questions) return 0;
    try {
        const passages = JSON.parse(question.questions);
        if (!Array.isArray(passages)) return 0;
        
        return passages.reduce((total, passage) => {
            if (!passage.instructionGroups) return total;
            const passageQuestions = passage.instructionGroups.reduce((subTotal: any, group: any) => {
                return subTotal + (group.questions?.length || 0);
            }, 0);
            return total + passageQuestions;
        }, 0);
    } catch (e) {
        console.error("Failed to parse questions for count:", e);
        return 0;
    }
}


export default function ReadingSelectionPage() {
  const { logout } = useAuth()
  const router = useRouter()
  const [readingQuestions, setReadingQuestions] = useState<any[]>([])
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
        const response = await fetch("/api/reading-questions")
        if (response.ok) {
          const data = await response.json()
          const questions = Array.isArray(data) ? data : data.questions || []
          setReadingQuestions(questions)
        } else {
          console.error("Failed to load reading questions")
          setReadingQuestions([])
        }
      } catch (error) {
        console.error("Error loading reading questions:", error)
        setReadingQuestions([])
      }
    }

    loadQuestions()
  }, [router])

  const filteredQuestions = readingQuestions.filter((question) => {
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
    router.push(`/examinee/reading/exam/${questionId}`)
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
                <h1 className="text-2xl font-bold text-gray-900">Reading Exams</h1>
              </div>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Select a Reading Exam</h2>
            <p className="text-gray-600">Choose one of the available reading exams to begin</p>
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
              Showing {filteredQuestions.length} of {readingQuestions.length} exams
            </div>
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {readingQuestions.length === 0 ? "No Reading Exams Available" : "No Exams Found"}
              </h2>
              <p className="text-gray-600">
                {readingQuestions.length === 0
                  ? "There are currently no reading exams available. Please contact your teacher."
                  : "Try adjusting your search terms or date filter to find more exams."}
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredQuestions.map((question) => {
                const questionCount = getTotalQuestionCount(question);
                return (
                  <Card key={question.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{question.title}</CardTitle>
                            <CardDescription className="mt-1">
                              A full reading test with 3 passages and {questionCount} questions.
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
                      <div className="flex justify-end">
                        <Button onClick={() => startExam(question.id)}>Start Exam</Button>
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