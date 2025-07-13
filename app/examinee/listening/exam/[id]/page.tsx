"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Clock, CheckCircle, Headphones, User, Volume2 } from "lucide-react"

interface Question {
  text: string;
}

interface InstructionGroup {
  instructionText: string;
  questions: Question[];
}
interface ListeningQuestion {
  id: number
  title: string
  audio_url: string
  questions: InstructionGroup[]
  text?: string
  created_at: string
}

export default function ListeningExamPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const examId = params.id as string
  const audioRef = useRef<HTMLAudioElement>(null)

  const [examData, setExamData] = useState<ListeningQuestion | null>(null)
  const [answers, setAnswers] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [totalDuration, setTotalDuration] = useState<number | null>(null);
  const [examStartTime] = useState(Date.now())
  const [examineeName, setExamineeName] = useState("")
  const [examineeId, setExamineeId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [audioPlayed, setAudioPlayed] = useState(false)
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

    if (examId) {
      loadExamFromDatabase(examId)
    }
  }, [examId, router])

  const loadExamFromDatabase = async (examId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/listening-questions/${examId}`)
      if (!response.ok) {
        throw new Error(`Exam not found or failed to load. Status: ${response.status}`)
      }
      const data = await response.json();
      const question = data.question;

      if (!question) {
        toast({
          title: "Exam not found",
          description: "The requested exam could not be found in the database.",
          variant: "destructive",
        })
        router.push("/examinee/listening")
        return;
      }

      let parsedInstructionGroups: InstructionGroup[] = []
      try {
        if (typeof question.questions === "string") {
          parsedInstructionGroups = JSON.parse(question.questions)
        } else if (Array.isArray(question.questions)) {
          parsedInstructionGroups = question.questions
        }
      } catch (error) {
        console.error("Error parsing questions:", error)
        parsedInstructionGroups = []
      }

      const examWithParsedQuestions = { ...question, questions: parsedInstructionGroups }
      setExamData(examWithParsedQuestions)
      const totalQuestions = parsedInstructionGroups.reduce((acc, group) => acc + group.questions.length, 0);
      setAnswers(new Array(totalQuestions).fill(""))
    } catch (error) {
      console.error("❌ Error loading listening exam from database:", error)
      toast({
        title: "Loading error",
        description: "Failed to load exam from database. Please try again.",
        variant: "destructive",
      })
      router.push("/examinee/listening")
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !examData) return;

    const handleMetadata = () => {
      if (audio.duration && audio.duration !== Infinity) {
        const audioDuration = Math.ceil(audio.duration);
        const extraTime = 120; // 2 minutes
        const totalExamTime = audioDuration + extraTime;

        setTimeLeft(totalExamTime);
        setTotalDuration(totalExamTime);
      } else {
        handleError();
      }
    };

    const handleError = () => {
      toast({
        title: "Audio Error",
        description: "Could not determine audio duration. Using a default 60-minute timer.",
        variant: "destructive",
      });
      const defaultTime = 3600;
      setTimeLeft(defaultTime);
      setTotalDuration(defaultTime);
    };

    audio.addEventListener('loadedmetadata', handleMetadata);
    audio.addEventListener('error', handleError);

    if (audio.readyState >= 1 && timeLeft === null) {
      handleMetadata();
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleMetadata);
      audio.removeEventListener('error', handleError);
    };
  }, [examData, timeLeft, toast]);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "Waiting...";
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handlePlayAudio = () => {
    if (audioRef.current && !audioPlayed) {
      audioRef.current.play().catch(error => {
        console.error("❌ Audio play error:", error)
        toast({
          title: "Audio Error",
          description: "Could not play the audio file.",
          variant: "destructive",
        })
      });
      setAudioPlayed(true);
      startTimer();
    }
  }

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers]
    newAnswers[index] = value
    setAnswers(newAnswers)
  }

  const generatePDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const maxLineWidth = pageWidth - margin * 2;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.height;
    const footerMargin = 20;
    let yPosition = margin;

    const addTextWithPageBreaks = (text: string, isTitle: boolean = false) => {
      if (isTitle) {
        doc.setFont("helvetica", "bold").setFontSize(14);
      } else {
        doc.setFont("helvetica", "normal").setFontSize(12);
      }
      const lines = doc.splitTextToSize(text, maxLineWidth);
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - footerMargin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
      yPosition += lineHeight / 2;
    };

    doc.setFontSize(20).setFont("helvetica", "bold");
    doc.text("Listening Exam Submission", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    addTextWithPageBreaks(`Student Name: ${examineeName}`);
    addTextWithPageBreaks(`Student ID: ${examineeId}`);
    addTextWithPageBreaks(`Exam Title: ${examData?.title}`);
    yPosition += 10;

    addTextWithPageBreaks("Questions and Answers:", true);
    let globalQuestionIndex = 0;
    (examData?.questions || []).forEach((group) => {
      addTextWithPageBreaks(`Instruction: ${group.instructionText}`, true);
      group.questions.forEach((question) => {
        const questionText = `Question ${globalQuestionIndex + 1}: ${question.text || ''}`;
        const answerText = `Answer: ${answers[globalQuestionIndex] || "No answer provided"}`;

        addTextWithPageBreaks(questionText, true);
        addTextWithPageBreaks(answerText);
        yPosition += lineHeight;
        globalQuestionIndex++;
      });
    });


    return doc;
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.pause();

      const pdf = await generatePDF()
      const pdfBlob = pdf.output("blob")

      const reader = new FileReader()
      reader.onload = async () => {
        const pdfDataUrl = reader.result as string
        const response = await fetch("/api/submit-exam", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        });
        const result = await response.json()
        if (result.success) {
          toast({ title: "Exam submitted successfully", description: `Your listening exam has been saved.` });
          router.push("/examinee");
        } else {
          throw new Error(result.error || "Submission failed");
        }
      }
      reader.readAsDataURL(pdfBlob);
    } catch (error) {
      console.error("Error submitting exam:", error);
      toast({ title: "Submission error", description: "There was an error submitting your exam. Please try again.", variant: "destructive" });
      setIsSubmitting(false);
    }
  }

  const handleAutoSubmit = () => {
    if (!isSubmitting) {
      toast({ title: "Time's up!", description: "Your exam will be automatically submitted.", variant: "destructive" });
      handleSubmit();
    }
  }

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading exam data...</p>
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
            <p className="text-gray-600">The exam could not be loaded. Please try again.</p>
            <Button onClick={() => router.push("/examinee/listening")} className="mt-4">
              Back to Listening Exams
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const progressPercentage = (totalDuration && timeLeft) ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;
  const isTimeWarning = timeLeft !== null && timeLeft < 600;
  const answeredQuestions = answers.filter((answer) => answer.trim() !== "").length;
  const totalQuestions = (examData?.questions || []).reduce((acc, group) => acc + group.questions.length, 0);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <audio ref={audioRef} src={examData?.audio_url} preload="metadata" />
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
                    <p className="text-sm text-gray-600">{examData?.title}</p>
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
                  className={`flex items-center gap-2 px-3 py-1 rounded-full ${isTimeWarning ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="font-mono text-sm">{formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>
            <div className="pb-4">
              <Progress value={audioPlayed ? progressPercentage : 0} className="h-2" />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-250px)]">
            <Card className="flex flex-col overflow-y-auto">
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
                      Click the play button below to start the audio and the exam timer. You can only play it once.
                    </p>
                  </div>
                  <div>
                    <Button
                      onClick={handlePlayAudio}
                      disabled={audioPlayed || !examData?.audio_url}
                      className="w-fit"
                      size="lg"
                    >
                      {audioPlayed ? "Audio Played" : "Play Audio"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col overflow-y-auto">
              <CardHeader>
                <CardTitle>Questions ({totalQuestions})</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-6">
                  {examData?.questions.map((group, groupIndex) => {
                    let questionOffset = 0;
                    for (let i = 0; i < groupIndex; i++) {
                      questionOffset += examData.questions[i].questions.length;
                    }
                    return (
                      <div key={groupIndex} className="p-3 bg-gray-100 rounded-md">
                        <p className="font-bold text-sm mb-3 whitespace-pre-wrap break-words">{group.instructionText}</p>
                        {group.questions.map((question, questionIndex) => {
                          const globalIndex = questionOffset + questionIndex;
                          return (
                            <div key={questionIndex} className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-sm font-medium text-purple-600">
                                  {globalIndex + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <label htmlFor={`question-${globalIndex}`} className="text-sm font-bold block mb-2 whitespace-pre-wrap break-words">
                                    {question.text || `Question ${globalIndex + 1}`}
                                  </label>
                                  <div className="relative">
                                    <Textarea
                                      id={`question-${globalIndex}`}
                                      placeholder="Enter your answer here..."
                                      value={answers[globalIndex] || ""}
                                      onChange={(e) => handleAnswerChange(globalIndex, e.target.value)}
                                      className="min-h-[100px] resize-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
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