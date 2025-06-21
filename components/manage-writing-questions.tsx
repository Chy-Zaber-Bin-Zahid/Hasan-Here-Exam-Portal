"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button, Table, Input, Space } from "antd"
import { QuestionCircleOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons"
import { v4 as uuidv4 } from "uuid"

interface Question {
  id: string
  question: string
  answer: string
}

const ManageWritingQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([])
  const [newQuestion, setNewQuestion] = useState<string>("")
  const [newAnswer, setNewAnswer] = useState<string>("")
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editedQuestion, setEditedQuestion] = useState<string>("")
  const [editedAnswer, setEditedAnswer] = useState<string>("")

  useEffect(() => {
    loadQuestionsFromDatabase()
  }, [])

  const loadQuestionsFromDatabase = async () => {
    try {
      const response = await fetch("/api/writing-questions")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      const questionsArray = data.questions || data || []
      console.log("✍️ Writing questions loaded:", questionsArray.length)
      setQuestions(questionsArray)
    } catch (error) {
      console.error("Could not load writing questions:", error)
    }
  }

  const saveQuestionsToDatabase = async () => {
    try {
      const response = await fetch("/api/writing-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questions: questions }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      console.log("✍️ Writing questions saved successfully!")
    } catch (error) {
      console.error("Could not save writing questions:", error)
    }
  }

  const handleAddQuestion = () => {
    if (newQuestion.trim() !== "" && newAnswer.trim() !== "") {
      const newQuestionObj: Question = {
        id: uuidv4(),
        question: newQuestion,
        answer: newAnswer,
      }
      setQuestions([...questions, newQuestionObj])
      setNewQuestion("")
      setNewAnswer("")
    }
  }

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter((question) => question.id !== id))
  }

  const handleEditQuestion = (question: Question) => {
    setEditingQuestionId(question.id)
    setEditedQuestion(question.question)
    setEditedAnswer(question.answer)
  }

  const handleUpdateQuestion = () => {
    if (editingQuestionId) {
      const updatedQuestions = questions.map((question) =>
        question.id === editingQuestionId ? { ...question, question: editedQuestion, answer: editedAnswer } : question,
      )
      setQuestions(updatedQuestions)
      setEditingQuestionId(null)
      setEditedQuestion("")
      setEditedAnswer("")
    }
  }

  const columns = [
    {
      title: "Question",
      dataIndex: "question",
      key: "question",
      render: (text: string) => <span style={{ wordWrap: "break-word", whiteSpace: "pre-line" }}>{text}</span>,
    },
    {
      title: "Answer",
      dataIndex: "answer",
      key: "answer",
      render: (text: string) => <span style={{ wordWrap: "break-word", whiteSpace: "pre-line" }}>{text}</span>,
    },
    {
      title: "Action",
      key: "action",
      render: (text: any, record: Question) => (
        <Space size="middle">
          <Button type="primary" icon={<EditOutlined />} onClick={() => handleEditQuestion(record)}>
            Edit
          </Button>
          <Button type="danger" icon={<DeleteOutlined />} onClick={() => handleDeleteQuestion(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2>
        Manage Writing Questions <QuestionCircleOutlined />
      </h2>

      <div>
        <Input placeholder="New Question" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} />
        <Input placeholder="New Answer" value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} />
        <Button type="primary" onClick={handleAddQuestion}>
          Add Question
        </Button>
      </div>

      {editingQuestionId && (
        <div>
          <Input
            placeholder="Edit Question"
            value={editedQuestion}
            onChange={(e) => setEditedQuestion(e.target.value)}
          />
          <Input placeholder="Edit Answer" value={editedAnswer} onChange={(e) => setEditedAnswer(e.target.value)} />
          <Button type="primary" onClick={handleUpdateQuestion}>
            Update Question
          </Button>
        </div>
      )}

      <Table rowKey="id" columns={columns} dataSource={questions} />

      <Button type="primary" onClick={saveQuestionsToDatabase}>
        Save Questions
      </Button>
    </div>
  )
}

export default ManageWritingQuestions
