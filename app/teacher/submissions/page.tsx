"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Search, CalendarIcon, Trash2, Eye, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface Submission {
  id: number;
  examinee_name: string;
  examinee_id: string;
  exam_title: string;
  exam_type: 'reading' | 'writing' | 'listening';
  submitted_at: string;
  pdf_path: string;
}

interface GroupedSubmissions {
  [key: string]: {
    examinee_name: string;
    submissions: Submission[];
  }
}

export default function SubmissionsPage() {
  const { logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")

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

  useEffect(() => {
    fetchSubmissions()
  }, [toast])

  const groupedAndFilteredSubmissions = useMemo(() => {
    const filtered = submissions.filter((submission) => {
      const searchTermLower = searchTerm.toLowerCase()
      const matchesSearch = submission.examinee_name.toLowerCase().includes(searchTermLower) ||
                            submission.examinee_id.toLowerCase().includes(searchTermLower) ||
                            submission.exam_title.toLowerCase().includes(searchTermLower);

      if (dateFilter === "all") return matchesSearch;

      const submissionDate = new Date(submission.submitted_at.replace(' ', 'T') + 'Z');
      const now = new Date();
      let matchesDate = false;

      switch (dateFilter) {
        case "today":
          matchesDate = submissionDate.getFullYear() === now.getFullYear() &&
                        submissionDate.getMonth() === now.getMonth() &&
                        submissionDate.getDate() === now.getDate();
          break
        case "week":
          const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          matchesDate = submissionDate >= weekAgo
          break
        case "month":
           const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          matchesDate = submissionDate >= monthAgo
          break
        default:
          matchesDate = true;
      }
      return matchesSearch && matchesDate;
    });

    return filtered.reduce<GroupedSubmissions>((acc, submission) => {
        const key = submission.examinee_id;
        if (!acc[key]) {
            acc[key] = {
                examinee_name: submission.examinee_name,
                submissions: []
            };
        }
        acc[key].submissions.push(submission);
        return acc;
    }, {});

  }, [submissions, searchTerm, dateFilter]);

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

  const handleDeleteAll = async () => {
    try {
      const response = await fetch(`/api/submissions`, { method: 'DELETE' });
      if (!response.ok) throw new Error("Failed to delete all submissions");

      setSubmissions([]);
      toast({ title: "Success", description: "All submissions have been deleted." });
    } catch (error) {
      toast({ title: "Error", description: "Could not delete all submissions.", variant: "destructive" });
    }
  };

  const handleDeleteByExaminee = async (examineeId: string) => {
    try {
        const response = await fetch(`/api/submissions/examinee/${examineeId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to delete submissions for this examinee.");
        }

        fetchSubmissions();
        toast({ title: "Success", description: `All submissions for student ID ${examineeId} deleted.` });
    } catch (error) {
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

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
              <div className="flex justify-between items-center">
                <CardTitle>All Submissions</CardTitle>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All Submissions
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete ALL submissions from ALL students and remove their files.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAll}>Delete All Submissions</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
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
                <Accordion type="single" collapsible className="w-full">
                  {Object.keys(groupedAndFilteredSubmissions).length > 0 ? (
                    Object.entries(groupedAndFilteredSubmissions).map(([examineeId, group]) => (
                      <AccordionItem value={examineeId} key={examineeId}>
                        <div className="flex items-center w-full">
                            <AccordionTrigger className="flex-1">
                                <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-gray-600" />
                                <span className="font-semibold">{group.examinee_name}</span>
                                <span className="text-gray-500">(ID: {examineeId})</span>
                                <Badge variant="outline">{group.submissions.length} submission(s)</Badge>
                                </div>
                            </AccordionTrigger>
                            <div className="pr-4">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={(e) => e.stopPropagation()}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete all for {group.examinee_name}?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete all {group.submissions.length} submissions for this student and remove their folder. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteByExaminee(examineeId)}>Yes, Delete All</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                        <AccordionContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Exam Title</TableHead>
                                <TableHead>Exam Type</TableHead>
                                <TableHead>Submitted At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.submissions.map(submission => (
                                <TableRow key={submission.id}>
                                  <TableCell>{submission.exam_title}</TableCell>
                                  <TableCell>
                                    <Badge variant={getBadgeVariant(submission.exam_type)} className="capitalize">
                                      {submission.exam_type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{new Date(submission.submitted_at).toLocaleString()}</TableCell>
                                  <TableCell className="text-right">
                                    <Button asChild variant="ghost" size="icon">
                                      <a href={`/api/files/pdf/${submission.pdf_path.replace('storage/', '')}`} target="_blank" rel="noopener noreferrer" title="View PDF">
                                        <Eye className="w-4 h-4" />
                                      </a>
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" title="Delete Submission">
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
                              ))}
                            </TableBody>
                          </Table>
                        </AccordionContent>
                      </AccordionItem>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No submissions found matching your criteria.
                    </div>
                  )}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}