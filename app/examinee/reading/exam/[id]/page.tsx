"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Clock, BookOpen, AlertTriangle, CheckCircle, User } from "lucide-react"

export default function ReadingExamPage() {
  const { logout } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const [examData, setExamData] = useState<any>(null)
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [timeLeft, setTimeLeft] = useState(3600) // 60 minutes in seconds
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [examineeName, setExamineeName] = useState("")
  const [examineeId, setExamineeId] = useState("")
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const name = localStorage.getItem("examineeName")
    const id = localStorage.getItem("examineeId")
    const examId = params.id

    if (!name || !id) {
      router.push("/dashboard")
      return
    }

    setExamineeName(name)
    setExamineeId(id)

    if (examId) {
        loadExamFromDatabase(examId as string)
    }
  }, [params.id, router])

  // FIX: Updated data fetching logic to get a single exam by ID
  const loadExamFromDatabase = async (examId: string) => {
    try {
      console.log("🔍 Loading reading exam from database, ID:", examId)

      const response = await fetch(`/api/reading-questions/${examId}`)
      if (!response.ok) {
          throw new Error(`Exam not found or failed to load. Status: ${response.status}`)
      }
      
      const data = await response.json()
      const currentExam = data.question

      if (!currentExam) {
        toast({
          title: "Exam not found",
          description: "The requested exam could not be found in the database.",
          variant: "destructive",
        })
        router.push("/examinee/reading")
        return
      }

      let parsedQuestions = []
      try {
        if (typeof currentExam.questions === "string") {
          parsedQuestions = JSON.parse(currentExam.questions)
        } else if (Array.isArray(currentExam.questions)) {
          parsedQuestions = currentExam.questions
        }
      } catch (error) {
        console.error("Error parsing questions:", error)
      }

      const examWithParsedQuestions = {
        ...currentExam,
        questions: parsedQuestions,
      }

      setExamData(examWithParsedQuestions)

      const initialAnswers: { [key: number]: string } = {}
      parsedQuestions.forEach((_: any, index: number) => {
        initialAnswers[index] = ""
      })
      setAnswers(initialAnswers)

      startTimer()
      setLoading(false)
    } catch (error) {
      console.error("❌ Error loading exam from database:", error)
      toast({
        title: "Loading error",
        description: "Failed to load exam from database. Please try again.",
        variant: "destructive",
      })
      router.push("/examinee/reading")
    }
  }

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const countWords = (text: string) => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }

  const handleAnswerChange = (questionIndex: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: value,
    }))
  }

  const generatePDF = async () => {
    const { jsPDF } = await import("jspdf")

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const margin = 20
    const lineHeight = 7
    let yPosition = margin

    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("Reading Exam Results", margin, yPosition)
    yPosition += lineHeight * 2

    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(`Student Name: ${examineeName}`, margin, yPosition)
    yPosition += lineHeight
    doc.text(`Student ID: ${examineeId}`, margin, yPosition)
    yPosition += lineHeight
    doc.text(`Exam Title: ${examData.title}`, margin, yPosition)
    yPosition += lineHeight
    doc.text(`Submission Date: ${new Date().toLocaleString()}`, margin, yPosition)
    yPosition += lineHeight * 2

    doc.setFont("helvetica", "bold")
    doc.text("Reading Passage:", margin, yPosition)
    yPosition += lineHeight
    doc.setFont("helvetica", "normal")

    const passageLines = doc.splitTextToSize(examData.passage, pageWidth - 2 * margin)
    passageLines.forEach((line: string) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = margin
      }
      doc.text(line, margin, yPosition)
      yPosition += lineHeight
    })
    yPosition += lineHeight

    doc.setFont("helvetica", "bold")
    doc.text("Questions and Answers:", margin, yPosition)
    yPosition += lineHeight * 1.5

    examData.questions.forEach((question: any, index: number) => {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = margin
      }

      doc.setFont("helvetica", "bold")
      doc.text(`Question ${index + 1}:`, margin, yPosition)
      yPosition += lineHeight
      doc.setFont("helvetica", "normal")

      const questionText = question.text || question.question || `Question ${index + 1}`
      const questionLines = doc.splitTextToSize(questionText, pageWidth - 2 * margin)
      questionLines.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = margin
        }
        doc.text(line, margin, yPosition)
        yPosition += lineHeight
      })
      yPosition += lineHeight * 0.5

      doc.setFont("helvetica", "bold")
      doc.text("Answer:", margin, yPosition)
      yPosition += lineHeight
      doc.setFont("helvetica", "normal")

      const answer = answers[index] || "No answer provided"
      const answerLines = doc.splitTextToSize(answer, pageWidth - 2 * margin)
      answerLines.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = margin
        }
        doc.text(line, margin, yPosition)
        yPosition += lineHeight
      })
      yPosition += lineHeight * 1.5
    })

    return doc
  }

  const handleSubmit = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      const pdf = await generatePDF()
      const pdfBlob = pdf.output("blob")

      const reader = new FileReader()
      reader.onload = async () => {
        const pdfDataUrl = reader.result as string

        const response = await fetch("/api/submit-exam", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            examType: "reading",
            examId: examData?.id,
            examTitle: examData?.title,
            examineeName: examineeName,
            examineeId: examineeId,
            answers: answers,
            pdfData: pdfDataUrl,
            timeSpent: 3600 - timeLeft,
          }),
        })

        const result = await response.json()

        if (result.success) {
          toast({
            title: "Exam submitted successfully",
            description: `Your reading exam has been saved.`,
          })

          router.push("/examinee")
        } else {
          throw new Error(result.error || "Submission failed")
        }
      }

      reader.readAsDataURL(pdfBlob)
    } catch (error) {
      console.error("Error submitting exam:", error)
      toast({
        title: "Submission error",
        description: "There was an error submitting your exam. Please try again.",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  const handleAutoSubmit = () => {
    toast({
      title: "Time's up!",
      description: "Your exam has been automatically submitted.",
      variant: "destructive",
    })
    handleSubmit()
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Exam...</h2>
            <p className="text-gray-600">Fetching exam data from database...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!examData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Not Found</h2>
            <p className="text-gray-600">The requested exam could not be loaded.</p>
            <Button onClick={() => router.push("/examinee/reading")} className="mt-4">
              Back to Reading Exams
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const answeredQuestions = Object.values(answers).filter((answer) => answer.trim() !== "").length
  const totalQuestions = examData.questions.length
  const progressPercentage = ((3600 - timeLeft) / 3600) * 100
  const isTimeWarning = timeLeft < 600

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">Reading Exam</h1>
                    <p className="text-sm text-gray-600">{examData.title}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{examineeName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {answeredQuestions}/{totalQuestions} answered
                  </span>
                </div>
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                    isTimeWarning ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="font-mono text-sm">{formatTime(timeLeft)}</span>
                </div>
                <Button variant="outline" onClick={logout}>
                  Logout
                </Button>
              </div>
            </div>

            <div className="pb-4">
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>
        </header>

        {isTimeWarning && (
          <Alert className="mx-4 mt-4 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              Warning: Less than 10 minutes remaining! Your exam will auto-submit when time expires.
            </AlertDescription>
          </Alert>
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-250px)]">
            <Card className="flex flex-col overflow-y-auto">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  Reading Passage
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {examData.passage || "No passage available for this exam."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col overflow-y-auto">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Questions ({totalQuestions})</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-6">
                  {examData.questions.map((question: any, index: number) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-sm font-medium text-green-600">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={`question-${index}`} className="text-sm font-medium block mb-2">
                            {question.text || question.question || `Question ${index + 1}`}
                          </Label>
                          <div className="relative">
                            <Textarea
                              id={`question-${index}`}
                              placeholder="Enter your answer here..."
                              value={answers[index] || ""}
                              onChange={(e) => handleAnswerChange(index, e.target.value)}
                              className="min-h-[100px] resize-none"
                            />
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">{countWords(answers[index] || "")} words</span>
                              {answers[index]?.trim() && <CheckCircle className="w-4 h-4 text-green-500" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex justify-center">
            <Button onClick={handleSubmit} disabled={isSubmitting} size="lg" className="px-12">
              {isSubmitting ? "Submitting..." : "Submit Exam"}
            </Button>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}