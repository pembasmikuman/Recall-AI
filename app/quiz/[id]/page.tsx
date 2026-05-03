'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Question } from '@/lib/types'

export default function QuizPage() {
  const { id } = useParams()
  const router = useRouter()

  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch(`/api/quiz/${id}`)
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Failed to load quiz')
          return
        }
        setQuestions(data.questions)
      } catch {
        setError('Failed to load quiz')
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [id])

  function handleSelect(questionId: string, option: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: option }))
  }

  async function handleSubmit() {
    if (Object.keys(answers).length < questions.length) {
      setError('Please answer all questions before submitting.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: id, answers }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to submit quiz')
        return
      }
      router.push(`/quiz/${id}/results?attemptId=${data.attemptId}`)
    } catch {
      setError('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading your quiz...</p>
      </div>
    )
  }

  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl mx-auto space-y-6">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Quiz Time</h1>
          <p className="text-gray-500 text-sm mt-1">{questions.length} questions — select one answer each</p>
        </div>

        {questions.map((q, index) => (
          <div key={q.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <p className="font-medium text-gray-900 mb-4">
              {index + 1}. {q.question_text}
            </p>
            <div className="space-y-2">
              {q.options.map((option) => {
                const selected = answers[q.id] === option
                return (
                  <button
                    key={option}
                    onClick={() => handleSelect(q.id, option)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                      selected
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 rounded-xl transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit Quiz →'}
        </button>

      </div>
    </div>
  )
}
