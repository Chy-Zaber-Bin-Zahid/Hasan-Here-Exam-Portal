"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
} from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"
import EditIcon from "@mui/icons-material/Edit"
import AddIcon from "@mui/icons-material/Add"

interface Question {
  id: number
  audio_url: string
  question_text: string
  options: string[]
  correct_answer: string
}

const ManageListeningQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([])
  const [open, setOpen] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [newQuestion, setNewQuestion] = useState<Question>({
    id: 0,
    audio_url: "",
    question_text: "",
    options: ["", "", "", ""],
    correct_answer: "",
  })

  useEffect(() => {
    loadQuestionsFromDatabase()
  }, [])

  const loadQuestionsFromDatabase = async () => {
    try {
      const response = await fetch("/api/listening-questions")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      const questionsArray = data.questions || data || []
      console.log("🎧 Listening questions loaded:", questionsArray.length)
      setQuestions(questionsArray)
    } catch (error) {
      console.error("Could not load listening questions:", error)
    }
  }

  const handleOpen = (question?: Question) => {
    setSelectedQuestion(question || null)
    setNewQuestion(
      question
        ? { ...question }
        : {
            id: 0,
            audio_url: "",
            question_text: "",
            options: ["", "", "", ""],
            correct_answer: "",
          },
    )
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    if (name.startsWith("options")) {
      const index = Number.parseInt(name.replace("options[", "").replace("]", ""))
      const newOptions = [...newQuestion.options]
      newOptions[index] = value
      setNewQuestion({ ...newQuestion, options: newOptions })
    } else {
      setNewQuestion({ ...newQuestion, [name]: value })
    }
  }

  const handleSubmit = async () => {
    try {
      const method = selectedQuestion ? "PUT" : "POST"
      const url = selectedQuestion ? `/api/listening-questions/${selectedQuestion.id}` : "/api/listening-questions"

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newQuestion),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      loadQuestionsFromDatabase()
      handleClose()
    } catch (error) {
      console.error("Could not save question:", error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/listening-questions/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      loadQuestionsFromDatabase()
    } catch (error) {
      console.error("Could not delete question:", error)
    }
  }

  return (
    <div>
      <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpen()}>
        Add New Question
      </Button>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="listening questions table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Audio URL</TableCell>
              <TableCell>Question Text</TableCell>
              <TableCell>Option 1</TableCell>
              <TableCell>Option 2</TableCell>
              <TableCell>Option 3</TableCell>
              <TableCell>Option 4</TableCell>
              <TableCell>Correct Answer</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {questions.map((question) => (
              <TableRow key={question.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                <TableCell component="th" scope="row">
                  {question.id}
                </TableCell>
                <TableCell>{question.audio_url}</TableCell>
                <TableCell>{question.question_text}</TableCell>
                <TableCell>{question.options[0]}</TableCell>
                <TableCell>{question.options[1]}</TableCell>
                <TableCell>{question.options[2]}</TableCell>
                <TableCell>{question.options[3]}</TableCell>
                <TableCell>{question.correct_answer}</TableCell>
                <TableCell>
                  <IconButton aria-label="edit" onClick={() => handleOpen(question)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton aria-label="delete" onClick={() => handleDelete(question.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>{selectedQuestion ? "Edit Question" : "Create New Question"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="audio_url"
            label="Audio URL"
            type="text"
            fullWidth
            value={newQuestion.audio_url}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="question_text"
            label="Question Text"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={newQuestion.question_text}
            onChange={handleInputChange}
          />
          {[0, 1, 2, 3].map((index) => (
            <TextField
              key={index}
              margin="dense"
              name={`options[${index}]`}
              label={`Option ${index + 1}`}
              type="text"
              fullWidth
              value={newQuestion.options[index]}
              onChange={handleInputChange}
            />
          ))}
          <TextField
            margin="dense"
            name="correct_answer"
            label="Correct Answer"
            type="text"
            fullWidth
            value={newQuestion.correct_answer}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit}>{selectedQuestion ? "Update" : "Create"}</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default ManageListeningQuestions
