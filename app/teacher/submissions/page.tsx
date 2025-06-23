"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Search, CalendarIcon, Trash2, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"

export default function SubmissionsPage() {
  const { logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/submissions")
        if (!response.ok) throw new Error("Failed to fetch submissions")
        const data = await response.json()
        setSubmissions(data.submissions || [])
      } catch (error) {
        toast({ title: "Error", description: "Could not fetch submissions.", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchSubmissions()
  }, [toast])

  const filteredSubmissions = submissions.filter((submission) => {
    const searchTermLower = searchTerm.toLowerCase()
    const matchesSearch = submission.examinee_name.toLowerCase().includes(searchTermLower) ||
                          submission.examinee_id.toLowerCase().includes(searchTermLower) ||
                          submission.exam_title.toLowerCase().includes(searchTermLower);

    if (dateFilter === "all") return matchesSearch;
    
    const submissionDate = new Date(submission.submitted_at)
    const now = new Date()
    let matchesDate = false;

    switch (dateFilter) {
      case "today":
        matchesDate = submissionDate.toDateString() === now.toDateString()
        break
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        matchesDate = submissionDate >= weekAgo
        break
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        matchesDate = submissionDate >= monthAgo
        break
      default:
        matchesDate = true;
    }

    return matchesSearch && matchesDate;
  })

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/submissions/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error("Failed to delete submission");
      
      setSubmissions(prev => prev.filter(s => s.id !== id));
      toast({ title: "Success", description: "Submission deleted successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Could not delete submission.", variant: "destructive" });
    }
  }

  const getBadgeVariant = (examType: string) => {
    switch (examType) {
      case 'reading': return 'default';
      case 'writing': return 'destructive';
      case 'listening': return 'secondary';
      default: return 'outline';
    }
  }

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
                <h1 className="text-2xl font-bold text-gray-900">Examinee Submissions</h1>
              </div>
              <Button variant="outline" onClick={logout}>Logout</Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle>All Submissions</CardTitle>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input placeholder="Search by name, ID, or exam title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <div className="sm:w-48">
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last Week</SelectItem>
                      <SelectItem value="month">Last Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Loading submissions...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Examinee Name</TableHead>
                      <TableHead>Examinee ID</TableHead>
                      <TableHead>Exam Title</TableHead>
                      <TableHead>Exam Type</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.length > 0 ? filteredSubmissions.map(submission => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">{submission.examinee_name}</TableCell>
                        <TableCell>{submission.examinee_id}</TableCell>
                        <TableCell>{submission.exam_title}</TableCell>
                        <TableCell>
                            <Badge variant={getBadgeVariant(submission.exam_type)} className="capitalize">
                                {submission.exam_type}
                            </Badge>
                        </TableCell>
                        <TableCell>{new Date(submission.submitted_at).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {/* FIX: Corrected the href for viewing PDFs */}
                          <Button asChild variant="ghost" size="sm">
                            <a href={`/api/files/pdf/${submission.pdf_path.replace('storage/', '')}`} target="_blank" rel="noopener noreferrer">
                              <Eye className="w-4 h-4" />
                            </a>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the submission and its associated files.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(submission.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">No submissions found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}