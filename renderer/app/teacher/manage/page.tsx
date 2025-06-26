"use client"

import { ArrowLeft, BookOpen, Headphones, PenTool } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../../components/auth-provider"
import { ProtectedRoute } from "../../../components/protected-route"
import { Button } from "../../../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { ManageReadingQuestions } from "../../../components/manage-reading-questions"
import { ManageListeningQuestions } from "../../../components/manage-listening-questions"
import { ManageWritingQuestions } from "../../../components/manage-writing-questions"

export default function ManageQuestionsPage() {
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
                <h1 className="text-2xl font-bold text-gray-900">Manage Questions</h1>
              </div>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Manage Existing Questions</h2>
            <p className="text-gray-600">Edit, delete, or view your existing question sets</p>
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
                  <CardTitle>Reading Questions</CardTitle>
                  <CardDescription>Manage your reading passages and questions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ManageReadingQuestions />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="listening" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Listening Questions</CardTitle>
                  <CardDescription>Manage your listening audio files and questions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ManageListeningQuestions />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="writing" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Writing Questions</CardTitle>
                  <CardDescription>Manage your writing prompts and instructions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ManageWritingQuestions />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  )
}
