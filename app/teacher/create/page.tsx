"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, Headphones, PenTool } from "lucide-react"
import { ReadingQuestionForm } from "@/components/reading-question-form"
import { ListeningQuestionForm } from "@/components/listening-question-form"
import { WritingQuestionForm } from "@/components/writing-question-form"

export default function CreateQuestionsPage() {
  const { logout } = useAuth()
  const router = useRouter()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.push("/teacher")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">Create Questions</h1>
              </div>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Exam Questions</h2>
            <p className="text-gray-600">Add questions for Reading, Listening, and Writing sections</p>
          </div>

          <Tabs defaultValue="reading" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="reading" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Reading
              </TabsTrigger>
              <TabsTrigger value="listening" className="flex items-center gap-2">
                <Headphones className="w-4 h-4" />
                Listening
              </TabsTrigger>
              <TabsTrigger value="writing" className="flex items-center gap-2">
                <PenTool className="w-4 h-4" />
                Writing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reading" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Reading Section</CardTitle>
                  <CardDescription>Add a reading passage and create questions based on the text</CardDescription>
                </CardHeader>
                <CardContent>
                  <ReadingQuestionForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="listening" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Listening Section</CardTitle>
                  <CardDescription>
                    Upload an audio file and create questions based on the audio content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ListeningQuestionForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="writing" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Writing Section</CardTitle>
                  <CardDescription>Create writing prompts and questions for students</CardDescription>
                </CardHeader>
                <CardContent>
                  <WritingQuestionForm />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  )
}
