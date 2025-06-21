"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

interface ListeningQuestion {
  id: number
  title: string
  audioFile: File | null
  audioUrl?: string
  questions: { text: string }[]
  createdAt: string
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

    // Load exam data
    const listeningQuestions = JSON.parse(localStorage.getItem("listeningQuestions") || "[]")
    const question = listeningQuestions.find((q: ListeningQuestion) => q.id.toString() === examId)

    if (!question) {
      toast({
        title: "Exam not found",
        description: "The requested exam could not be found.",
        variant: "destructive",
      })
      router.push("/examinee/listening")
      return
    }

    setExamData(question)
    setAnswers(new Array(question.questions.length).fill(""))

    // Create listening test folder
    const currentExaminee = localStorage.getItem("currentExaminee") || `${name}_${id}`
    const examineeFolder = JSON.parse(localStorage.getItem(currentExaminee) || "{}")

    if (!examineeFolder.activeExams) {
      examineeFolder.activeExams = {}
    }

    examineeFolder.activeExams.listening_test = {
      questionId: question.id,
      startTime: new Date().toISOString(),
      status: "in_progress",
    }

    localStorage.setItem(currentExaminee, JSON.stringify(examineeFolder))

    // Start timer
    startTimer()

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [examId, router, toast])

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
    if (audioRef.current && !audioPlayed) {
      // Create a demo audio URL for testing (you can replace this with actual audio)
      const demoAudioUrl =\
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66
