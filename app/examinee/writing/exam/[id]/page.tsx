"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Clock, FileText, User, Image as ImageIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

interface WritingQuestion {
  id: number
  title: string
  prompt: string;
  instructions: string;
  created_at: string
}

interface ParsedExamData {
    id: number;
    title: string;
    task1_prompt: string;
    task2_prompt: string;
    task2_instructions: string;
    imageUrl: string;
}

export default function WritingExamPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const examId = params.id as string

  const [examData, setExamData] = useState<ParsedExamData | null>(null)
  const [answers, setAnswers] = useState({ task1: "", task2: "" });
  const answersRef = useRef(answers);
  const [timeLeft, setTimeLeft] = useState(3600);
  const [examineeName, setExamineeName] = useState("")
  const [examineeId, setExamineeId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(isSubmitting);
  const [loading, setLoading] = useState(true)
  const [panelLayout, setPanelLayout] = useState<number[]>([50, 50]);
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [activeTab, setActiveTab] = useState("task1");
  const [showOverlay, setShowOverlay] = useState(true);
  const [countdown, setCountdown] = useState(10);
  const submittedRef = useRef(false); // 🛡️ Prevent double submission


  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

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

  useEffect(() => {
    if (countdown > 0) {
      const countdownTimer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(countdownTimer);
    } else if (showOverlay) {
        setShowOverlay(false);
        startTimer();
    }
}, [countdown, showOverlay]);

  const loadExamFromDatabase = async (examId: string) => {
    try {
      const response = await fetch(`/api/writing-questions/${examId}`)
      if (!response.ok) throw new Error(`Exam not found. Status: ${response.status}`)
      
      const data = await response.json()
      const question: WritingQuestion = data.question;

      if (!question) {
        toast({ title: "Exam not found", variant: "destructive" });
        router.push("/examinee/writing")
        return;
      }

      const prompts = JSON.parse(question.prompt);
      const details = JSON.parse(question.instructions);

      setExamData({
          id: question.id,
          title: question.title,
          task1_prompt: prompts.task1,
          task2_prompt: prompts.task2,
          task2_instructions: details.task2,
          imageUrl: details.imageUrl
      });
      
      setLoading(false)
    } catch (error) {
      console.error("❌ Error loading writing exam:", error)
      toast({ title: "Loading error", description: "Failed to load exam data.", variant: "destructive" });
      router.push("/examinee/writing")
    }
  }

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
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
    return text.trim().split(/\s+/).filter((word) => word.length > 0).length
  }

  const generatePDF = async (): Promise<any> => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const maxLineWidth = pageWidth - margin * 2;
    let y = margin;
    const lineSpacing = 12;

    const addWrappedText = ({
        text,
        options = {} as {
            x?: number;
            fontStyle?: string;
            fontSize?: number;
            textColor?: [number, number, number];
            align?: "left" | "center" | "right";
        },
        isAnswer = false
    }: {
        text: string;
        options?: {
            x?: number;
            fontStyle?: string;
            fontSize?: number;
            textColor?: [number, number, number];
            align?: "left" | "center" | "right";
        };
        isAnswer?: boolean;
    }) => {
        if (!text) return;
        const { x = margin, fontStyle = "normal", fontSize = 10, textColor = [0, 0, 0], align } = options;
        
        doc.setFont("helvetica", fontStyle).setFontSize(fontSize).setTextColor(textColor[0], textColor[1], textColor[2]);

        const lines = doc.splitTextToSize(text, isAnswer ? maxLineWidth - 10 : maxLineWidth);
        lines.forEach((line: string) => {
            if (y > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                y = margin;
            }
            if (align) {
                doc.text(line, x, y, { align });
            } else {
                doc.text(line, x, y);
            }
            y += lineSpacing;
        });
    };

    doc.setFont("helvetica", "bold").setFontSize(18);
    addWrappedText({ text: 'Writing Exam Submission', options: { x: pageWidth / 2, align: 'center' } });
    y += 10;
    
    doc.setFont("helvetica", "normal").setFontSize(10);
    doc.text(`Examinee: ${examineeName} (ID: ${examineeId})`, margin, y);
    const dateText = `Submitted: ${new Date().toLocaleString()}`;
    const dateWidth = doc.getStringUnitWidth(dateText) * 10;
    doc.text(dateText, pageWidth - margin - dateWidth, y);
    y += 20;
    doc.setDrawColor(200, 200, 200).line(margin, y, pageWidth - margin, y);
    y += 20;

    doc.setFont("helvetica", "bold").setFontSize(14);
    addWrappedText({ text: "Writing Task 1" });
    y += 5;
    
    if (examData?.imageUrl) {
        try {
            const response = await fetch(examData.imageUrl);
            const blob = await response.blob();
            const imageBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

            const imgProps = doc.getImageProperties(imageBase64);
            const imgWidth = maxLineWidth * 0.8;
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
            if (y + imgHeight > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
            doc.addImage(imageBase64, 'PNG', margin, y, imgWidth, imgHeight);
            y += imgHeight + 15;
        } catch (error) {
            console.error("Failed to load image for PDF:", error);
            addWrappedText({ text: "[Image could not be loaded]", options: { textColor: [255, 0, 0] } });
        }
    }
    
    addWrappedText({ text: "Prompt:", options: { fontStyle: 'bold' } });
    addWrappedText({ text: examData?.task1_prompt || "", options: { fontSize: 10 } });
    y += 15;
    addWrappedText({ text: "Examinee's Response:", options: { fontStyle: 'bold' } });
    addWrappedText({ text: answersRef.current.task1 || "[No answer provided]", isAnswer: true });
    
    doc.addPage();
    y = margin;
    doc.setFont("helvetica", "bold").setFontSize(14);
    addWrappedText({ text: "Writing Task 2" });
    y += 10;

    addWrappedText({ text: "Prompt:", options: { fontStyle: 'bold' } });
    addWrappedText({ text: examData?.task2_prompt || "", options: { fontSize: 10 } });
    y += 10;
    addWrappedText({ text: "Instructions:", options: { fontStyle: 'bold' } });
    addWrappedText({ text: examData?.task2_instructions || "", options: { fontSize: 10 } });
    y += 15;
    
    addWrappedText({ text: "Examinee's Response:", options: { fontStyle: 'bold' } });
    addWrappedText({ text: answersRef.current.task2 || "[No answer provided]", isAnswer: true });

    return doc;
  };

const handleSubmit = async () => {
  if (submittedRef.current) return;
  submittedRef.current = true;
  setIsSubmitting(true);

  try {
    if (timerRef.current) clearInterval(timerRef.current);

    const pdf = await generatePDF();
    const pdfBlob = pdf.output("blob");
    const reader = new FileReader();

    reader.onloadend = async () => {
      const pdfDataUrl = reader.result as string;
      const response = await fetch("/api/submit-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examType: "writing",
          examId: examData?.id,
          examTitle: examData?.title,
          examineeName,
          examineeId,
          answers: answersRef.current,
          pdfData: pdfDataUrl,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast({ title: "Exam submitted successfully!" });
        router.push("/examinee");
      } else {
        throw new Error(result.error || "Submission failed");
      }
    };

    reader.readAsDataURL(pdfBlob);
  } catch (error) {
    console.error("Error submitting exam:", error);
    toast({ title: "Submission error", variant: "destructive" });
    setIsSubmitting(false);
  }
};


const handleAutoSubmit = () => {
  if (submittedRef.current) return;
  if (timerRef.current) clearInterval(timerRef.current);
  handleSubmit();
};


  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, []);
  
  const progressPercentage = ((3600 - timeLeft) / 3600) * 100;

  if (loading || !examData) {
    return <ProtectedRoute><div className="flex justify-center items-center min-h-screen">Loading Exam...</div></ProtectedRoute>
  }

  return (
    <ProtectedRoute>
       {showOverlay && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex flex-col justify-center items-center z-50">
                    <p className="text-white text-2xl mb-4">The exam will begin in:</p>
                    <p className="text-white font-bold text-9xl">{countdown}</p>
                </div>
            )}
      <div className="flex flex-col h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b sticky top-0 z-10 p-4 space-y-3">
            <div className="flex justify-between items-center">
                {/* FIX: Dynamic title based on active tab */}
                <h1 className="text-lg font-semibold text-gray-900">
                    {`Writing Exam: ${activeTab === 'task1' ? 'Task 1' : 'Task 2'}`}
                </h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4" /><span>{examineeName}</span></div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                        <Clock className="w-4 h-4" />
                        <span className="font-mono text-sm">{formatTime(timeLeft)}</span>
                    </div>
                </div>
            </div>
            <Progress value={progressPercentage} className="h-2" />
        </header>

        <main className="flex-1 min-h-0">
         {/* FIX: Use onValueChange to update the active tab state */}
         <Tabs defaultValue="task1" onValueChange={setActiveTab} className="p-4 md:p-6 h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="task1">Writing Task 1</TabsTrigger>
                <TabsTrigger value="task2">Writing Task 2</TabsTrigger>
            </TabsList>
            
            <TabsContent value="task1" className="mt-4 flex-1 min-h-0">
                <ResizablePanelGroup 
                    direction="horizontal" 
                    className="h-full"
                    onLayout={(sizes: number[]) => setPanelLayout(sizes)}
                >
                    <ResizablePanel defaultSize={panelLayout[0]}>
                        <Card className="flex flex-col overflow-y-auto h-full">
                            <CardHeader><CardTitle>Task 1: Prompt & Image</CardTitle></CardHeader>
                            <CardContent className="flex-1 space-y-4 overflow-y-auto p-4">
                                <div className="p-4 bg-gray-100 rounded-md border">
                                    <p className="text-sm whitespace-pre-wrap break-words">{examData.task1_prompt}</p>
                                </div>
                                {examData.imageUrl && <img src={examData.imageUrl} alt="Task 1 visual aid" className="rounded-lg border mb-4 w-full"/>}
                            </CardContent>
                        </Card>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={panelLayout[1]}>
                        <Card className="flex flex-col h-full">
                            <CardHeader><CardTitle>Your Answer for Task 1</CardTitle></CardHeader>
                            <CardContent className="flex-1 flex flex-col p-4 pt-0 overflow-y-auto">
                                 <div className="text-right text-sm text-gray-500 pb-2 pr-1">{countWords(answers.task1)} words</div>
                                 <Textarea
                                    value={answers.task1}
                                    onChange={(e) => setAnswers(prev => ({ ...prev, task1: e.target.value }))}
                                    placeholder="Write your response for Task 1 here..."
                                    className="flex-1 w-full text-base resize-none"
                                    spellCheck="false"
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                />
                            </CardContent>
                        </Card>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </TabsContent>

            <TabsContent value="task2" className="mt-4 flex-1 min-h-0">
                 <ResizablePanelGroup 
                    direction="horizontal" 
                    className="h-full"
                    onLayout={(sizes: number[]) => setPanelLayout(sizes)}
                 >
                    <ResizablePanel defaultSize={panelLayout[0]}>
                        <Card className="flex flex-col overflow-y-auto h-full">
                            <CardHeader><CardTitle>Task 2: Prompt & Instructions</CardTitle></CardHeader>
                            <CardContent className="flex-1 space-y-4 overflow-y-auto p-4">
                                 <div className="p-4 bg-gray-100 rounded-md border">
                                    <p className="font-semibold mb-2">Prompt:</p>
                                    <p className="text-sm whitespace-pre-wrap break-words">{examData.task2_prompt}</p>
                                 </div>
                                 <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                                    <p className="font-semibold mb-2 text-blue-800">Instructions:</p>
                                    <p className="text-sm whitespace-pre-wrap break-words">{examData.task2_instructions}</p>
                                 </div>
                            </CardContent>
                        </Card>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={panelLayout[1]}>
                        <Card className="flex flex-col h-full">
                            <CardHeader><CardTitle>Your Answer for Task 2</CardTitle></CardHeader>
                             <CardContent className="flex-1 flex flex-col p-4 pt-0 overflow-y-auto">
                                 <div className="text-right text-sm text-gray-500 pb-2 pr-1">{countWords(answers.task2)} words</div>
                                 <Textarea
                                    value={answers.task2}
                                    onChange={(e) => setAnswers(prev => ({ ...prev, task2: e.target.value }))}
                                    placeholder="Write your response for Task 2 here..."
                                    className="flex-1 w-full text-base resize-none"
                                    spellCheck="false"
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                />
                            </CardContent>
                        </Card>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </TabsContent>
         </Tabs>
        </main>
        
        <footer className="p-4 bg-white border-t flex justify-center">
            <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
              {isSubmitting ? "Submitting..." : "Submit Both Tasks"}
            </Button>
        </footer>
      </div>
    </ProtectedRoute>
  )
}