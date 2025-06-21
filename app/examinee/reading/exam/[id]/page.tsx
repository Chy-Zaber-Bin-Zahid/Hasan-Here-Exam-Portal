"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Clock, BookOpen, AlertTriangle, CheckCircle } from "lucide-react"

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

    // Load exam data
    const readingQuestions = JSON.parse(localStorage.getItem("readingQuestions") || "[]")
    const currentExam = readingQuestions.find((q: any) => q.id.toString() === examId)

    if (!currentExam) {
      toast({
        title: "Exam not found",
        description: "The requested exam could not be found.",
        variant: "destructive",
      })
      router.push("/examinee/reading")
      return
    }

    setExamData(currentExam)

    // Initialize answers object
    const initialAnswers: { [key: number]: string } = {}
    currentExam.questions.forEach((_: any, index: number) => {
      initialAnswers[index] = ""
    })
    setAnswers(initialAnswers)

    // Start timer
    startTimer()

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [params.id, router, toast])

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

  const handleAnswerChange = (questionIndex: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: value,
    }))
  }

  const generatePDF = async () => {
    // Import jsPDF dynamically
    const { jsPDF } = await import("jspdf")

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const margin = 20
    const lineHeight = 7
    let yPosition = margin

    // Header
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("Reading Exam Results", margin, yPosition)
    yPosition += lineHeight * 2

    // Student Info
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

    // Passage
    doc.setFont("helvetica", "bold")
    doc.text("Reading Passage:", margin, yPosition)
    yPosition += lineHeight
    doc.setFont("helvetica", "normal")

    // Split passage into lines that fit the page width
    const passageLines = doc.splitTextToSize(examData.passage, pageWidth - 2 * margin)
    passageLines.forEach((line: string) => {
      if (yPosition > 270) {
        // Check if we need a new page
        doc.addPage()
        yPosition = margin
      }
      doc.text(line, margin, yPosition)
      yPosition += lineHeight
    })
    yPosition += lineHeight

    // Questions and Answers
    doc.setFont("helvetica", "bold")
    doc.text("Questions and Answers:", margin, yPosition)
    yPosition += lineHeight * 1.5

    examData.questions.forEach((question: any, index: number) => {
      if (yPosition > 250) {
        // Check if we need a new page
        doc.addPage()
        yPosition = margin
      }

      // Question
      doc.setFont("helvetica", "bold")
      doc.text(`Question ${index + 1}:`, margin, yPosition)
      yPosition += lineHeight
      doc.setFont("helvetica", "normal")

      const questionLines = doc.splitTextToSize(question.text, pageWidth - 2 * margin)
      questionLines.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = margin
        }
        doc.text(line, margin, yPosition)
        yPosition += lineHeight
      })
      yPosition += lineHeight * 0.5

      // Answer
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
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      // Generate PDF
      const pdf = await generatePDF()
      const pdfBlob = pdf.output("blob")

      // Create PDF data URL for storage simulation
      const reader = new FileReader()
      reader.onload = () => {
        const pdfDataUrl = reader.result as string

        // Update folder structure with exam results
        const folderData = JSON.parse(localStorage.getItem("examineeFolder") || "{}")
        const currentTime = new Date().toISOString()

        // Store exam results
        folderData.examResults = folderData.examResults || {}
        folderData.examResults.reading_test = {
          examId: examData.id,
          examTitle: examData.title,
          answers: answers,
          submittedAt: currentTime,
          timeSpent: 3600 - timeLeft,
          pdfData: pdfDataUrl,
          status: "completed",
        }

        // Update active exam status
        if (folderData.activeExams?.reading_test) {
          folderData.activeExams.reading_test.status = "completed"
          folderData.activeExams.reading_test.completedAt = currentTime
        }

        localStorage.setItem("examineeFolder", JSON.stringify(folderData))

        toast({
          title: "Exam submitted successfully",
          description: "Your reading exam has been submitted and saved as PDF.",
        })

        // Navigate back to examinee dashboard
        router.push("/examinee")
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

  if (!examData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Exam...</h2>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const answeredQuestions = Object.values(answers).filter((answer) => answer.trim() !== "").length
  const totalQuestions = examData.questions.length

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-green-600" />
                  <h1 className="text-xl font-bold text-gray-900">{examData.title}</h1>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Progress:</span>
                  <span className="text-sm font-medium">
                    {answeredQuestions}/{totalQuestions} answered
                  </span>
                </div>

                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                    timeLeft < 600 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
                </div>

                <Button variant="outline" onClick={logout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Time Warning */}
        {timeLeft < 600 && timeLeft > 0 && (
          <Alert className="mx-4 mt-4 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              Warning: Less than 10 minutes remaining! Your exam will auto-submit when time expires.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
            {/* Left Panel - Reading Passage */}
            <Card className="h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  Reading Passage
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full overflow-y-auto">
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{examData.passage}</p>
                </div>
              </CardContent>
            </Card>

            {/* Right Panel - Questions */}
            <Card className="h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Questions ({totalQuestions})</CardTitle>
              </CardHeader>
              <CardContent className="h-full overflow-y-auto">
                <div className="space-y-6">
                  {examData.questions.map((question: any, index: number) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-gray-500 mt-1 min-w-[60px]">Q{index + 1}.</span>
                        <div className="flex-1">
                          <Label htmlFor={`question-${index}`} className="text-sm font-medium">
                            {question.text}
                          </Label>
                        </div>
                        {answers[index]?.trim() && <CheckCircle className="w-4 h-4 text-green-500 mt-1" />}
                      </div>
                      <Textarea
                        id={`question-${index}`}
                        placeholder="Enter your answer here..."
                        value={answers[index] || ""}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        className="min-h-[100px] ml-[68px]"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-center">
            <Button onClick={handleSubmit} disabled={isSubmitting} size="lg" className="px-8">
              {isSubmitting ? "Submitting..." : "Submit Exam"}
            </Button>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
