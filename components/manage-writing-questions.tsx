"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Edit, Trash2, Eye, Loader2, FileText } from "lucide-react"
import { ViewWritingQuestionModal } from "@/components/view-writing-question-modal"
import { EditWritingQuestionModal } from "@/components/edit-writing-question-modal"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Search } from "lucide-react"

export function ManageWritingQuestions() {
  const { toast } = useToast()
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingQuestion, setViewingQuestion] = useState<any>(null)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    loadQuestionsFromDatabase()
  }, [])

  const loadQuestionsFromDatabase = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/writing-questions")
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setQuestions(data.questions || [])
    } catch (error) {
      console.error("❌ Error loading writing questions:", error)
      toast({ title: "Error", description: "Failed to load writing questions.", variant: "destructive" })
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  const filteredQuestions = questions.filter((question) => {
    const title = question.title || "";
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());

    if (dateFilter === "all") return matchesSearch;

    const questionDate = new Date(question.created_at || Date.now());
    const now = new Date();

    switch (dateFilter) {
      case "today":
        return matchesSearch && questionDate.toDateString() === now.toDateString();
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return matchesSearch && questionDate >= weekAgo;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return matchesSearch && questionDate >= monthAgo;
      default:
        return matchesSearch;
    }
  });

  const deleteQuestion = async (id: number) => {
    try {
      const response = await fetch(`/api/writing-questions/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      setQuestions(questions.filter((q) => q.id !== id));
      toast({ title: "Question deleted", description: "The writing question set has been deleted." });
    } catch (error) {
      console.error("❌ Error deleting question:", error);
      toast({ title: "Error", description: "Failed to delete the question.", variant: "destructive" });
    }
  };

  const handleEditSave = async (updatedQuestion: any) => {
    try {
        setLoading(true);
        setEditingQuestion(null);
        const response = await fetch(`/api/writing-questions/${updatedQuestion.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedQuestion),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        toast({ title: "Question updated", description: "The writing question set has been updated successfully." });
        await loadQuestionsFromDatabase(); // Refresh data from server
    } catch (error) {
        console.error("❌ Error updating question:", error);
        toast({ title: "Error", description: "Failed to update the question.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading writing questions...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Search by title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <div className="sm:w-48">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger><CalendarIcon className="w-4 h-4 mr-2" /><SelectValue placeholder="Filter by date" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredQuestions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No writing questions found matching your criteria.</p>
        </div>
      ) : (
        filteredQuestions.map((question) => {
          let prompts = { task1: "N/A", task2: "N/A" };
          try {
            if (question.prompt) prompts = JSON.parse(question.prompt);
          } catch {}
          return (
          <Card key={question.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">{question.title}</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setViewingQuestion(question)}><Eye className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingQuestion(question)}><Edit className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => deleteQuestion(question.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-start gap-2"><FileText className="w-4 h-4 mt-1 shrink-0 text-blue-500" /><strong>Task 1:</strong> <span className="line-clamp-2">{prompts.task1}</span></p>
                  <p className="flex items-start gap-2"><FileText className="w-4 h-4 mt-1 shrink-0 text-green-500" /><strong>Task 2:</strong> <span className="line-clamp-2">{prompts.task2}</span></p>
                  <p className="text-xs text-gray-400 pt-2">Created: {new Date(question.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        )})
      )}

      {viewingQuestion && (
        <ViewWritingQuestionModal question={viewingQuestion} open={!!viewingQuestion} onOpenChange={(open) => !open && setViewingQuestion(null)} />
      )}
      {editingQuestion && (
        <EditWritingQuestionModal question={editingQuestion} open={!!editingQuestion} onOpenChange={(open) => !open && setEditingQuestion(null)} onSave={handleEditSave} />
      )}
    </div>
  )
}