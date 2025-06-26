"use client"

import { CheckCircle, Clock, User } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { MouseEvent, useEffect, useRef, useState } from "react"
import { useAuth } from "../../../../../components/auth-provider";
import { useToast } from "../../../../../hooks/use-toast";
import { ProtectedRoute } from "../../../../../components/protected-route";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../components/ui/tabs";
import { Progress } from "../../../../../components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Label } from "../../../../../components/ui/label";
import { Textarea } from "../../../../../components/ui/textarea";
import { Button } from "../../../../../components/ui/button";

// --- Interfaces for Data Structures ---
interface Question {
    text: string;
}
interface InstructionGroup {
    instructionText: string;
    questions: Question[];
}
interface Passage {
    title: string;
    passage: string;
    instructionGroups: InstructionGroup[];
}
interface ReadingExam {
    id: number;
    title: string;
    passages: Passage[];
}

// --- Component to render the passage with highlights ---
const HighlightedPassage = ({ passageText, highlights, onRemoveHighlight }: { passageText: string, highlights: any[], onRemoveHighlight: (highlightId: number) => void }) => {
    if (!highlights || highlights.length === 0) {
        return <>{passageText}</>;
    }

    const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);
    let lastIndex = 0;
    const parts = [];

    sortedHighlights.forEach((h) => {
        if (h.start > lastIndex) {
            parts.push(passageText.substring(lastIndex, h.start));
        }
        parts.push(
            <mark key={h.id} className="highlight" onClick={() => onRemoveHighlight(h.id)}>
                {passageText.substring(h.start, h.end)}
            </mark>
        );
        lastIndex = h.end;
    });

    if (lastIndex < passageText.length) {
        parts.push(passageText.substring(lastIndex));
    }

    return <>{parts}</>;
};

export default function ReadingExamPage() {
    const { logout } = useAuth()
    const router = useRouter()
    const params = useParams()
    const { toast } = useToast()
    
    const [examData, setExamData] = useState<ReadingExam | null>(null)
    const [answers, setAnswers] = useState<string[]>([]);
    const [timeLeft, setTimeLeft] = useState(3600);
    const [examineeName, setExamineeName] = useState("")
    const [examineeId, setExamineeId] = useState("")
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [highlights, setHighlights] = useState<any[][]>([[], [], []]);
    const [activePassageIndex, setActivePassageIndex] = useState(0);
    
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    
    useEffect(() => {
        const name = localStorage.getItem("examineeName");
        const id = localStorage.getItem("examineeId");
        if (!name || !id) router.push("/dashboard");
        else {
            setExamineeName(name);
            setExamineeId(id);
        }
        
        if (params.id) loadExamFromDatabase(params.id as string);

    }, [params.id, router]);
    
    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const loadExamFromDatabase = async (examId: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/reading-questions/${examId}`);
            if (!response.ok) throw new Error(`Exam not found. Status: ${response.status}`);
            
            const data = await response.json();
            const currentExam = data.question;
            if (!currentExam) {
                toast({ title: "Exam not found", variant: "destructive" });
                router.push("/examinee/reading");
                return;
            }

            const parsedPassages = typeof currentExam.questions === 'string' ? JSON.parse(currentExam.questions) : currentExam.questions;
            setExamData({ ...currentExam, passages: parsedPassages });

            const totalQuestions = parsedPassages.reduce((acc: number, p: Passage) => 
                acc + p.instructionGroups.reduce((iAcc, ig) => iAcc + ig.questions.length, 0), 0);
            
            setAnswers(new Array(totalQuestions).fill(""));
            startTimer();
        } catch (error) {
            console.error("❌ Error loading exam:", error);
            toast({ title: "Loading error", variant: "destructive" });
            router.push("/examinee/reading");
        } finally {
            setLoading(false);
        }
    };

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    if(timerRef.current) clearInterval(timerRef.current);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const handleAnswerChange = (questionIndex: number, value: string) => {
        const newAnswers = [...answers];
        newAnswers[questionIndex] = value;
        setAnswers(newAnswers);
    };

    const handleContextMenu = (e: MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            
            const passageContainer = e.currentTarget;
            if (!passageContainer.contains(range.startContainer) || !passageContainer.contains(range.endContainer)) {
                selection.removeAllRanges();
                return;
            }
            
            const preSelectionRange = document.createRange();
            preSelectionRange.selectNodeContents(passageContainer);
            preSelectionRange.setEnd(range.startContainer, range.startOffset);
            const start = preSelectionRange.toString().length;
            const end = start + range.toString().length;

            const currentHighlights = highlights[activePassageIndex] || [];
            const isOverlapping = currentHighlights.some(h => start < h.end && end > h.start);

            if (isOverlapping) {
                toast({ title: "Cannot highlight overlapping text.", variant: "destructive" });
                selection.removeAllRanges();
                return;
            }

            const newHighlight = { id: Date.now(), start, end };

            setHighlights(prev => {
                const newHighlights = [...prev];
                newHighlights[activePassageIndex] = [...(newHighlights[activePassageIndex] || []), newHighlight];
                return newHighlights;
            });
            selection.removeAllRanges();
        }
    };
    
    const handleRemoveHighlight = (highlightId: number) => {
        setHighlights(prev => {
            const newHighlights = [...prev];
            newHighlights[activePassageIndex] = newHighlights[activePassageIndex].filter(h => h.id !== highlightId);
            return newHighlights;
        });
    };
    
    // --- FINAL, CORRECTED PDF Generation Function ---
    const generatePDF = async () => {
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF({ unit: "pt", format: "a4" });
    
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 40;
        const maxLineWidth = pageWidth - margin * 2;
        let y = margin;
        let globalQuestionCounter = 0; 
    
        const addWrappedText = (text: string, options: any = {}) => {
            const { x = margin, fontStyle = "normal", fontSize = 10, textColor = [0, 0, 0], lineSpacing = 12 } = options;
            doc.setFont("helvetica", fontStyle).setFontSize(fontSize).setTextColor(textColor[0], textColor[1], textColor[2]);
    
            const lines = doc.splitTextToSize(text, maxLineWidth);
            lines.forEach((line: string) => {
                if (y > doc.internal.pageSize.getHeight() - margin) {
                    doc.addPage();
                    y = margin;
                }
                doc.text(line, x, y);
                y += lineSpacing;
            });
        };
    
        // Header
        doc.setFont("helvetica", "bold").setFontSize(20);
        addWrappedText(examData?.title || 'Reading Exam', { x: pageWidth / 2, align: 'center', lineSpacing: 20 });
        y += 10;
        doc.setFont("helvetica", "normal").setFontSize(10);
        doc.text(`Examinee: ${examineeName} (ID: ${examineeId})`, margin, y);
        y += 20;
        doc.setDrawColor(220, 220, 220).line(margin, y, pageWidth - margin, y);
        y += 20;
    
        // Content
        examData?.passages.forEach((passage, pIndex) => {
            if (pIndex > 0) { doc.addPage(); y = margin; }
            doc.setFontSize(16).setFont('helvetica', 'bold');
            addWrappedText(passage.title, { lineSpacing: 18 });
            
            let questionNumberInPassage = 1;
            passage.instructionGroups.forEach(group => {
                y += 10;
                addWrappedText(`Instructions: ${group.instructionText}`, { fontStyle: 'italic', fontSize: 10, lineSpacing: 14 });
                y += 10;
                
                group.questions.forEach((q) => {
                    const questionText = `${questionNumberInPassage}. ${q.text}`;
                    addWrappedText(questionText, { fontSize: 11, fontStyle: 'bold', lineSpacing: 14 });
    
                    addWrappedText(`   Answer: ${answers[globalQuestionCounter] || "No answer provided"}`, { fontSize: 11, textColor: [0, 0, 150], x: margin + 10 });
                    y += 20;
                    
                    globalQuestionCounter++;
                    questionNumberInPassage++;
                });
            });
        });
    
        return doc;
    };
    
    const handleSubmit = async () => {
        if(isSubmitting) return;
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
                        examType: "reading",
                        examId: examData?.id,
                        examTitle: examData?.title,
                        examineeName,
                        examineeId,
                        answers,
                        pdfData: pdfDataUrl,
                    }),
                });
                const result = await response.json();
                if (result.success) {
                    toast({ title: "Exam submitted successfully" });
                    router.push("/examinee");
                } else {
                    throw new Error(result.error || "Submission failed");
                }
            };
            reader.readAsDataURL(pdfBlob);
        } catch (error) {
            console.error("Submission error:", error);
            toast({ title: "Submission Error", variant: "destructive" });
            setIsSubmitting(false);
        }
    };

    const handleAutoSubmit = () => {
        if(isSubmitting) return;
        handleSubmit();
    };

    if (loading || !examData) return <ProtectedRoute><div className="flex justify-center items-center min-h-screen">Loading Exam...</div></ProtectedRoute>;
    
    const answeredQuestions = answers.filter(a => a.trim()).length;
    const totalQuestions = answers.length;
    
    return (
        <ProtectedRoute>
            <style jsx global>{`.highlight { background-color: #fef08a; cursor: pointer; }`}</style>
            
            <div className="flex flex-col h-screen bg-gray-50">
                <header className="bg-white shadow-sm border-b p-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <h1 className="text-lg font-semibold">{examData.title}</h1>
                        <div className="flex items-center gap-4">
                            <span className="text-sm flex items-center gap-1"><User className="w-4 h-4" /> {examineeName}</span>
                            <span className="text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {answeredQuestions}/{totalQuestions} Answered</span>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                                <Clock className="w-4 h-4" /><span className="font-mono">{formatTime(timeLeft)}</span>
                            </div>
                        </div>
                    </div>
                    <Progress value={(3600 - timeLeft) / 36} className="h-2" />
                </header>

                <main className="flex-1 min-h-0">
                    <Tabs defaultValue="passage-0" onValueChange={(val) => setActivePassageIndex(parseInt(val.split('-')[1]))} className="h-full flex flex-col">
                        <TabsList className="grid w-full grid-cols-3">
                            {examData.passages.map((_, index) => (
                                <TabsTrigger key={index} value={`passage-${index}`}>Passage {index + 1}</TabsTrigger>
                            ))}
                        </TabsList>

                        {examData.passages.map((passage, pIndex) => {
                            let passageQuestionOffset = 0;
                            if (pIndex > 0) {
                                for (let i = 0; i < pIndex; i++) {
                                    passageQuestionOffset += examData.passages[i].instructionGroups.reduce((acc, ig) => acc + ig.questions.length, 0);
                                }
                            }
                            
                            return (
                                <TabsContent key={pIndex} value={`passage-${pIndex}`} className="flex-1 min-h-0">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full p-4">
                                        <Card className="flex flex-col overflow-y-auto">
                                            <CardHeader>
                                                <CardTitle>{passage.title}</CardTitle>
                                                <CardDescription className="text-xs pt-1">
                                                    Select text and right-click to highlight. Click on a highlight to remove it.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent 
                                                onContextMenu={handleContextMenu}
                                                className="flex-1 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed"
                                            >
                                               <HighlightedPassage 
                                                    passageText={passage.passage} 
                                                    highlights={highlights[pIndex]}
                                                    onRemoveHighlight={handleRemoveHighlight}
                                                />
                                            </CardContent>
                                        </Card>
                                        <Card className="flex flex-col overflow-y-auto">
                                            <CardHeader><CardTitle>Questions</CardTitle></CardHeader>
                                            <CardContent className="flex-1 overflow-y-auto space-y-4">
                                                {passage.instructionGroups.map((group, gIndex) => {
                                                    let questionCounterInGroup = 0;
                                                    if (gIndex > 0) {
                                                        for (let i = 0; i < gIndex; i++) {
                                                            questionCounterInGroup += passage.instructionGroups[i].questions.length;
                                                        }
                                                    }
                                                    return (
                                                    <div key={gIndex} className="p-3 bg-gray-100 rounded-md">
                                                        <p className="italic text-sm mb-3 whitespace-pre-wrap">{group.instructionText}</p>
                                                        {group.questions.map((q, qIndex) => {
                                                            const globalQIndex = passageQuestionOffset + questionCounterInGroup + qIndex;
                                                            const questionNumberForDisplay = questionCounterInGroup + qIndex + 1;
                                                            return (
                                                                <div key={qIndex} className="space-y-2 mb-4">
                                                                    <Label htmlFor={`q-${globalQIndex}`} className="flex items-start gap-2">
                                                                        <span className="font-bold">{questionNumberForDisplay}.</span> 
                                                                        <span className="flex-1 whitespace-pre-wrap">{q.text}</span>
                                                                    </Label>
                                                                    <Textarea
                                                                        id={`q-${globalQIndex}`}
                                                                        value={answers[globalQIndex] || ''}
                                                                        onChange={(e) => handleAnswerChange(globalQIndex, e.target.value)}
                                                                        spellCheck="false"
                                                                    />
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )})}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>
                            )
                        })}
                    </Tabs>
                </main>
                 <footer className="p-4 bg-white border-t flex justify-center">
                    <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
                        {isSubmitting ? "Submitting..." : "Submit Exam"}
                    </Button>
                </footer>
            </div>
        </ProtectedRoute>
    )
}