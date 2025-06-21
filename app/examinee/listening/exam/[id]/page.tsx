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
import { Clock, CheckCircle, AlertTriangle, Headphones, User, Play, Volume2, Pause } from "lucide-react"

interface ListeningQuestion {
  id: number
  title: string
  audio_url: string
  questions: string | any[]
  text?: string
  created_at: string
}

export default function ListeningExamPage() {
  const { logout } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const examId = params.id as string
  const audioRef = useRef<HTMLAudioElement>(null)

  const [examData, setExamData] = useState<ListeningQuestion | null>(null)
  const [answers, setAnswers] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(3600) // 60 minutes in seconds
  const [examStartTime] = useState(Date.now())
  const [examineeName, setExamineeName] = useState("")
  const [examineeId, setExamineeId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [audioPlayed, setAudioPlayed] = useState(false)
  const [audioEnded, setAudioEnded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
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
      console.log("🔍 Loading listening exam from database, ID:", examId)

      const response = await fetch("/api/listening-questions")
      const data = await response.json()

      console.log("🎧 Database response:", data)

      // Handle different response formats
      let questions = []
      if (data.success && Array.isArray(data.questions)) {
        questions = data.questions
      } else if (Array.isArray(data)) {
        questions = data
      }

      const question = questions.find((q: ListeningQuestion) => q.id.toString() === examId)

      if (!question) {
        toast({
          title: "Exam not found",
          description: "The requested exam could not be found in the database.",
          variant: "destructive",
        })
        router.push("/examinee/listening")
        return
      }

      // Parse questions if they're stored as JSON string
      let parsedQuestions = []
      try {
        if (typeof question.questions === "string") {
          parsedQuestions = JSON.parse(question.questions)
        } else if (Array.isArray(question.questions)) {
          parsedQuestions = question.questions
        }
      } catch (error) {
        console.error("Error parsing questions:", error)
        parsedQuestions = []
      }

      const examWithParsedQuestions = {
        ...question,
        questions: parsedQuestions,
      }

      console.log("✅ Listening exam loaded:", {
        title: examWithParsedQuestions.title,
        questionsCount: parsedQuestions.length,
        audioUrl: examWithParsedQuestions.audio_url ? "Present" : "Missing",
      })

      setExamData(examWithParsedQuestions)
      setAnswers(new Array(parsedQuestions.length).fill(""))

      // Start timer
      startTimer()
      setLoading(false)
    } catch (error) {
      console.error("❌ Error loading listening exam from database:", error)
      toast({
        title: "Loading error",
        description: "Failed to load exam from database. Please try again.",
        variant: "destructive",
      })
      router.push("/examinee/listening")
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

  const handlePlayAudio = () => {
    if (audioRef.current && examData?.audio_url) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        // Set the audio source to the correct path
        const audioPath = examData.audio_url.startsWith("/")
          ? examData.audio_url
          : `/api/files/audio/${examData.audio_url}`

        console.log("🎵 Playing audio from:", audioPath)

        audioRef.current.src = audioPath
        audioRef.current
          .play()
          .then(() => {
            setAudioPlayed(true)
            setIsPlaying(true)
          })
          .catch((error) => {
            console.error("❌ Audio play error:", error)
            toast({
              title: "Audio Error",
              description: "Could not play the audio file. Please check if the file exists.",
              variant: "destructive",
            })
          })
      }
    }
  }

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers]
    newAnswers[index] = value
    setAnswers(newAnswers)
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
    doc.text("Listening Exam Submission", pageWidth / 2, yPosition, { align: "center" })
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
    yPosition += 15

    // Audio Info
    doc.setFont("helvetica", "bold")
    yPosition = addWrappedText("Audio File:", margin, yPosition, pageWidth - 2 * margin, 14)
    yPosition += 5
    doc.setFont("helvetica", "normal")
    yPosition = addWrappedText(examData?.audio_url || "No audio file", margin, yPosition, pageWidth - 2 * margin)
    yPosition += 15

    // Questions and Answers
    doc.setFont("helvetica", "bold")
    yPosition = addWrappedText("Questions and Answers:", margin, yPosition, pageWidth - 2 * margin, 14)
    yPosition += 10

    examData?.questions.forEach((question: any, index: number) => {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = margin
      }

      // Question
      doc.setFont("helvetica", "bold")
      yPosition = addWrappedText(`Question ${index + 1}:`, margin, yPosition, pageWidth - 2 * margin)
      yPosition += 5
      doc.setFont("helvetica", "normal")
      const questionText = question.text || question.question || `Question ${index + 1}`
      yPosition = addWrappedText(questionText, margin, yPosition, pageWidth - 2 * margin)
      yPosition += 10

      // Answer
      doc.setFont("helvetica", "bold")
      yPosition = addWrappedText("Answer:", margin, yPosition, pageWidth - 2 * margin)
      yPosition += 5
      doc.setFont("helvetica", "normal")
      const answer = answers[index] || "No answer provided"
      yPosition = addWrappedText(answer, margin, yPosition, pageWidth - 2 * margin)
      yPosition += 15
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

      // Stop audio if playing
      if (audioRef.current) {
        audioRef.current.pause()
        setIsPlaying(false)
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
            examType: "listening",
            examId: examData?.id,
            examTitle: examData?.title,
            examineeName: examineeName,
            examineeId: examineeId,
            answers: answers,
            pdfData: pdfDataUrl,
            timeSpent: Math.floor((Date.now() - examStartTime) / 1000),
          }),
        })

        const result = await response.json()

        if (result.success) {
          toast({
            title: "Exam submitted successfully",
            description: `Your listening exam has been saved to: ${result.folderPath}`,
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

  // Cleanup timer and audio on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
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
            <Headphones className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Not Found</h2>
            <p className="text-gray-600">The requested exam could not be loaded.</p>
            <Button onClick={() => router.push("/examinee/listening")} className="mt-4">
              Back to Listening Exams
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const progressPercentage = ((3600 - timeLeft) / 3600) * 100
  const isTimeWarning = timeLeft < 600 // Less than 10 minutes
  const answeredQuestions = answers.filter((answer) => answer.trim() !== "").length

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          onEnded={() => {
            setAudioEnded(true)
            setIsPlaying(false)
          }}
          onError={(e) => {
            console.error("Audio error:", e)
            toast({
              title: "Audio Error",
              description: "There was an error playing the audio file.",
              variant: "destructive",
            })
            setIsPlaying(false)
          }}
          preload="metadata"
        />

        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Headphones className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">Listening Exam</h1>
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
                    {answeredQuestions}/{examData.questions.length} answered
                  </span>
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
            {/* Left Panel - Audio Player */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-purple-600" />
                  Audio Player
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center justify-center">
                <div className="text-center space-y-6">
                  <div className="w-32 h-32 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <Volume2 className="w-16 h-16 text-purple-600" />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Listen to the audio</h3>
                    <p className="text-sm text-gray-600 max-w-md">
                      Click the play button below to start the audio. Listen carefully and answer the questions.
                    </p>
                    {examData.text && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">{examData.text}</p>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handlePlayAudio}
                    disabled={!examData.audio_url}
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    {isPlaying ? "Pause Audio" : "Play Audio"}
                  </Button>

                  {audioPlayed && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Audio has been played</span>
                    </div>
                  )}

                  {audioEnded && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Audio playback completed</span>
                    </div>
                  )}

                  {!examData.audio_url && (
                    <div className="text-sm text-red-600">No audio file available for this exam.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right Panel - Questions */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Questions ({examData.questions.length})</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-6">
                  {examData.questions.map((question: any, index: number) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-sm font-medium text-purple-600">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <label htmlFor={`question-${index}`} className="text-sm font-medium block mb-2">
                            {question.text || question.question || `Question ${index + 1}`}
                          </label>
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
