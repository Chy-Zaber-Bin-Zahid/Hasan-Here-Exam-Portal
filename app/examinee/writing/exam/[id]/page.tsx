"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Clock, CheckCircle, AlertTriangle, FileText, User } from "lucide-react"

interface WritingQuestion {
  id: number
  title: string
  prompt: string
  instructions: string
  word_limit?: number
  created_at: string
}

export default function WritingExamPage() {
  const { logout } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const examId = params.id as string

  const [examData, setExamData] = useState<WritingQuestion | null>(null)
  const [answer, setAnswer] = useState("")
  const [timeLeft, setTimeLeft] = useState(3600) // 60 minutes in seconds
  const [examStartTime] = useState(Date.now())
  const [examineeName, setExamineeName] = useState("")
  const [examineeId, setExamineeId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const name = localStorage.getItem("examineeName")
    const id = localStorage.getItem("examineeId")

    if (!name || !id) {
      router.push("/dashboard")
      return
    }

    setExamineeName(name)
    setExamineeId(id)

    // Load exam data from database
    loadExamFromDatabase(examId)
  }, [examId, router])

  const loadExamFromDatabase = async (examId: string) => {
    try {
      console.log("🔍 Loading writing exam from database, ID:", examId)

      const response = await fetch("/api/writing-questions")
      const data = await response.json()

      console.log("✍️ Database response:", data)

      // Handle different response formats
      let questions = []
      if (data.success && Array.isArray(data.questions)) {
        questions = data.questions
      } else if (Array.isArray(data)) {
        questions = data
      }

      const question = questions.find((q: WritingQuestion) => q.id.toString() === examId)

      if (!question) {
        toast({
          title: "Exam not found",
          description: "The requested exam could not be found in the database.",
          variant: "destructive",
        })
        router.push("/examinee/writing")
        return
      }

      console.log("✅ Writing exam loaded:", {
        title: question.title,
        prompt: question.prompt ? "Present" : "Missing",
        instructions: question.instructions ? "Present" : "Missing",
      })

      setExamData(question)

      // Start timer
      startTimer()
      setLoading(false)
    } catch (error) {
      console.error("❌ Error loading writing exam from database:", error)
      toast({
        title: "Loading error",
        description: "Failed to load exam from database. Please try again.",
        variant: "destructive",
      })
      router.push("/examinee/writing")
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

  const generatePDF = async () => {
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const margin = 20
    const lineHeight = 7
    let yPosition = margin

    // Helper function to add text with word wrapping
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize = 12) => {
      doc.setFontSize(fontSize)
      const lines = doc.splitTextToSize(text, maxWidth)
      doc.text(lines, x, y)
      return y + lines.length * lineHeight
    }

    // Header
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("Writing Exam Submission", pageWidth / 2, yPosition, { align: "center" })
    yPosition += 15

    // Student Info
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    yPosition = addWrappedText(`Student Name: ${examineeName}`, margin, yPosition, pageWidth - 2 * margin)
    yPosition = addWrappedText(`Student ID: ${examineeId}`, margin, yPosition, pageWidth - 2 * margin)
    yPosition = addWrappedText(`Exam Title: ${examData?.title}`, margin, yPosition, pageWidth - 2 * margin)
    yPosition = addWrappedText(`Date: ${new Date().toLocaleDateString()}`, margin, yPosition, pageWidth - 2 * margin)
    yPosition = addWrappedText(
      `Time Spent: ${Math.floor((Date.now() - examStartTime) / 1000 / 60)} minutes`,
      margin,
      yPosition,
      pageWidth - 2 * margin,
    )
    yPosition += 10

    // Prompt
    doc.setFont("helvetica", "bold")
    yPosition = addWrappedText("Writing Prompt:", margin, yPosition, pageWidth - 2 * margin, 14)
    yPosition += 5
    doc.setFont("helvetica", "normal")
    yPosition = addWrappedText(examData?.prompt || "", margin, yPosition, pageWidth - 2 * margin)
    yPosition += 10

    // Instructions
    if (examData?.instructions) {
      doc.setFont("helvetica", "bold")
      yPosition = addWrappedText("Instructions:", margin, yPosition, pageWidth - 2 * margin, 14)
      yPosition += 5
      doc.setFont("helvetica", "normal")
      yPosition = addWrappedText(examData.instructions, margin, yPosition, pageWidth - 2 * margin)
      yPosition += 15
    }

    // Answer
    doc.setFont("helvetica", "bold")
    yPosition = addWrappedText("Student Answer:", margin, yPosition, pageWidth - 2 * margin, 14)
    yPosition += 5
    doc.setFont("helvetica", "normal")

    if (answer.trim()) {
      yPosition = addWrappedText(answer, margin, yPosition, pageWidth - 2 * margin)
    } else {
      yPosition = addWrappedText("No answer provided.", margin, yPosition, pageWidth - 2 * margin)
    }

    return doc
  }

  const handleSubmit = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      // Generate PDF
      const pdf = await generatePDF()
      const pdfBlob = pdf.output("blob")

      // Create PDF data URL for storage
      const reader = new FileReader()
      reader.onload = async () => {
        const pdfDataUrl = reader.result as string

        // Submit to API
        const response = await fetch("/api/submit-exam", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            examType: "writing",
            examId: examData?.id,
            examTitle: examData?.title,
            examineeName: examineeName,
            examineeId: examineeId,
            answers: { answer },
            pdfData: pdfDataUrl,
            timeSpent: Math.floor((Date.now() - examStartTime) / 1000),
          }),
        })

        const result = await response.json()

        if (result.success) {
          toast({
            title: "Exam submitted successfully",
            description: `Your writing exam has been saved to: ${result.folderPath}`,
          })

          // Navigate back to examinee dashboard
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

  // Cleanup timer on unmount
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading exam from database...</p>
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
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Not Found</h2>
            <p className="text-gray-600">The requested exam could not be loaded.</p>
            <Button onClick={() => router.push("/examinee/writing")} className="mt-4">
              Back to Writing Exams
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const progressPercentage = ((3600 - timeLeft) / 3600) * 100
  const isTimeWarning = timeLeft < 600 // Less than 10 minutes
  const wordCount = countWords(answer)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">Writing Exam</h1>
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
                  <FileText className="w-4 h-4" />
                  <span>{wordCount} words</span>
                  {examData.word_limit && <span className="text-xs text-gray-500">/ {examData.word_limit} limit</span>}
                </div>
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full ${isTimeWarning ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}
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

        {/* Time Warning */}
        {isTimeWarning && (
          <Alert className="mx-4 mt-4 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              Warning: Less than 10 minutes remaining! Your exam will auto-submit when time expires.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-250px)]">
            {/* Left Panel - Prompt and Instructions */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-600" />
                  Writing Prompt
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Prompt:</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed break-words">
                        {examData.prompt || "No prompt available for this exam."}
                      </p>
                    </div>
                  </div>

                  {examData.instructions && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Instructions:</h3>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-blue-800 whitespace-pre-wrap leading-relaxed break-words">
                          {examData.instructions}
                        </p>
                      </div>
                    </div>
                  )}

                  {examData.word_limit && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Word Limit:</h3>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-yellow-800">Maximum {examData.word_limit} words</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right Panel - Answer Area */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Your Answer
                  </span>
                  <div className="flex items-center gap-2">
                    {answer.trim() && <CheckCircle className="w-4 h-4 text-green-600" />}
                    <span className="text-sm text-gray-500">
                      {wordCount} words
                      {examData.word_limit && (
                        <span className={wordCount > examData.word_limit ? "text-red-500" : ""}>
                          {" "}
                          / {examData.word_limit}
                        </span>
                      )}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <Textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="flex-1 min-h-[400px] resize-none text-base leading-relaxed"
                />
                {examData.word_limit && wordCount > examData.word_limit && (
                  <p className="text-sm text-red-500 mt-2">
                    Warning: You have exceeded the word limit by {wordCount - examData.word_limit} words.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Submit Button - Bottom Center */}
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
