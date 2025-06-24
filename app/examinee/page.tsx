"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { ArrowLeft, PenTool, Headphones, BookOpen, User, Clock, AlertTriangle, Info, Volume2 } from "lucide-react"

export default function ExamineePage() {
  const { logout } = useAuth()
  const router = useRouter()
  const [examineeName, setExamineeName] = useState("")
  const [examineeId, setExamineeId] = useState("")
  const [folderName, setFolderName] = useState("")

  useEffect(() => {
    const name = localStorage.getItem("examineeName")
    const id = localStorage.getItem("examineeId")
    const currentExaminee = localStorage.getItem("currentExaminee")

    if (!name || !id) {
      router.push("/dashboard")
      return
    }

    setExamineeName(name)
    setExamineeId(id)
    setFolderName(currentExaminee || `${name}_${id}`)
  }, [router])

  const handleModuleClick = (module: string) => {
    router.push(`/examinee/${module.toLowerCase()}`)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">Exam Portal</h1>
              </div>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Welcome, {examineeName}</h2>
                  <p className="text-gray-600">Student ID: {examineeId}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Exam Guidelines</AlertTitle>
              <AlertDescription>
                Please read the following instructions carefully before starting your exam.
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <CardTitle className="text-base text-orange-800">Time Limit</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-orange-700">
                    Each exam has a 60-minute time limit. The exam will auto-submit when time expires.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <CardTitle className="text-base text-red-800">No Back Option</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-700">
                    Once you start an exam, you cannot go back to previous questions. Answer carefully.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-base text-blue-800">Auto Submit</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-700">
                    Your answers will be automatically saved and submitted when the time limit is reached.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-purple-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-purple-600" />
                    <CardTitle className="text-base text-purple-800">Listening Audio</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-purple-700">
                    Audio in listening exams will play only once with no pause or replay option.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="pt-6 mt-6 border-t">
               <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Video Instruction</h3>
               <div className="relative h-0 bg-gray-200 rounded-lg overflow-hidden" style={{ paddingTop: '56.25%' }}>
                 <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                    title="Instructions for Candidates for Written Exams (Exams Office)"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                 ></iframe>
               </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Select Exam Module</h3>
            <p className="text-gray-600">Choose the module you want to take</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* FIX: Added flexbox classes to align content */}
            <Card className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleModuleClick("Writing")}>
              <CardHeader className="flex-grow text-center">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <PenTool className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-xl">Writing</CardTitle>
                <CardDescription>Test your writing skills with essay and composition tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Start Writing Module
                </Button>
              </CardContent>
            </Card>

            <Card className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleModuleClick("Listening")}>
              <CardHeader className="flex-grow text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Headphones className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Listening</CardTitle>
                <CardDescription>Improve your listening comprehension with audio exercises</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Start Listening Module
                </Button>
              </CardContent>
            </Card>

            <Card className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleModuleClick("Reading")}>
              <CardHeader className="flex-grow text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Reading</CardTitle>
                <CardDescription>Enhance your reading comprehension with various texts</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Start Reading Module
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}