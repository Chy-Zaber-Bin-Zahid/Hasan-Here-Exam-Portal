"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Clock, BookOpen, CheckCircle, User, Highlighter } from "lucide-react"

export default function ReadingExamPage() {
  const { logout } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const [examData, setExamData] = useState<any>(null)
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [timeLeft, setTimeLeft] = useState(3600)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [examineeName, setExamineeName] = useState("")
  const [examineeId, setExamineeId] = useState("")
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [examStartTime] = useState(Date.now())
  
  const passageRef = useRef<HTMLDivElement>(null);
  const [popover, setPopover] = useState<{ show: boolean; x: number; y: number }>({ show: false, x: 0, y: 0 });

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

  const loadExamFromDatabase = async (examId: string) => {
    try {
      setLoading(true);
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
        router.push("/examinee/reading");
        return; 
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

      const examWithParsedQuestions = { ...currentExam, questions: parsedQuestions }
      setExamData(examWithParsedQuestions)

      const initialAnswers: { [key: number]: string } = {}
      parsedQuestions.forEach((_: any, index: number) => {
        initialAnswers[index] = ""
      })
      setAnswers(initialAnswers)

      startTimer()
    } catch (error) {
      console.error("❌ Error loading exam from database:", error)
      toast({
        title: "Loading error",
        description: "Failed to load exam from database. Please try again.",
        variant: "destructive",
      })
      router.push("/examinee/reading")
    } finally {
        setLoading(false);
    }
  }

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if(timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }
  
  const handleAutoSubmit = () => {
    if (!isSubmitting) {
      toast({
        title: "Time's up!",
        description: "Your exam will be automatically submitted.",
        variant: "destructive",
      });
      handleSubmit();
    }
  };

  const handleMouseUp = () => {
    // A brief delay to allow click events to fire before selection is cleared
    setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            if (passageRef.current && passageRef.current.contains(range.commonAncestorContainer)) {
                const rect = range.getBoundingClientRect();
                setPopover({
                    show: true,
                    x: rect.left + window.scrollX + (rect.width / 2) - 50,
                    y: rect.top + window.scrollY - 45,
                });
            }
        } else {
            setPopover({ show: false, x: 0, y: 0 });
        }
    }, 10);
  };

  // FIX: Using a more robust method to wrap selected text
  const handleHighlight = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const mark = document.createElement('mark');
        mark.className = 'highlight';
        try {
            // This method is more robust than surroundContents
            const selectionContents = range.extractContents();
            mark.appendChild(selectionContents);
            range.insertNode(mark);
        } catch (e) {
            console.error("Highlighting failed: ", e);
            toast({ title: "Highlight Error", description: "Cannot highlight this selection.", variant: "destructive" });
        }
        selection.removeAllRanges();
    }
    setPopover({ show: false, x: 0, y: 0 });
  };

  // FIX: Improved un-highlighting logic
  const handlePassageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'MARK' && target.classList.contains('highlight')) {
        const parent = target.parentNode;
        if (parent) {
            const text = document.createTextNode(target.textContent || "");
            parent.replaceChild(text, target);
            parent.normalize(); // Merges adjacent text nodes for a clean DOM
        }
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])
  
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

  if (loading) {
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
      <style jsx global>{`
        .highlight {
            background-color: #fef08a; /* A pleasant yellow */
            cursor: pointer;
            border-radius: 2px;
        }
        ::selection {
            background: #a5d8ff; /* Custom selection color */
        }
      `}</style>

      {popover.show && (
        <div 
          className="absolute z-20" 
          style={{ left: popover.x, top: popover.y }}
          onMouseDown={(e) => e.stopPropagation()} // Prevent this click from closing the popover
        >
            <Button size="sm" onClick={handleHighlight} className="shadow-lg">
                <Highlighter className="w-4 h-4 mr-2" />
                Highlight
            </Button>
        </div>
      )}

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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{height: 'calc(100vh - 230px)'}}>
            
            <Card className="flex flex-col overflow-y-auto">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  Reading Passage
                </CardTitle>
                <CardDescription>
                  Select text to highlight, or click a highlight to remove it.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div 
                    ref={passageRef} 
                    className="prose prose-sm max-w-none" 
                    onMouseUp={handleMouseUp}
                    onClick={handlePassageClick}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {examData.passage || "No passage available for this exam."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col overflow-y-auto">
              <CardHeader className="pb-4">
                 <CardTitle className="text-lg">Questions ({examData.questions.length})</CardTitle>
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
                            {question.text || `Question ${index + 1}`}
                          </Label>
                          <Textarea
                            id={`question-${index}`}
                            placeholder="Enter your answer here..."
                            value={answers[index] || ""}
                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                            className="min-h-[100px] resize-none"
                          />
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