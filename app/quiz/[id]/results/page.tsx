'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Question } from '@/lib/types'

type ResultData = {
  score: number
  total: number
  answers: Record<string, string>
  questions: Question[]
}

export default function ResultsPage() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const attemptId = searchParams.get('attemptId')

  const [data, setData] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch(`/api/results/${attemptId}`)
        const json = await res.json()
        if (!res.ok) {
          setError(json.error || 'Failed to load results')
          return
        }
        setData(json)
      } catch {
        setError('Failed to load results')
      } finally {
        setLoading(false)
      }
    }
    if (attemptId) fetchResults()
  }, [attemptId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading results...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error || 'Something went wrong'}</p>
      </div>
    )
  }

  const percentage = Math.round((data.score / data.total) * 100)

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl mx-auto space-y-6">

        {/* Score card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
          <p className="text-5xl font-bold text-blue-600">{percentage}%</p>
          <p className="text-gray-500 mt-2">{data.score} out of {data.total} correct</p>
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => router.push('/quiz/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
            >
              New Quiz
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* Question breakdown */}
        <h2 className="text-lg font-semibold text-gray-900">Review</h2>
        {data.questions.map((q, index) => {
          const chosen = data.answers[q.id]
          const correct = q.correct_answer
          const isCorrect = chosen === correct

          return (
            <div
              key={q.id}
              className={`bg-white rounded-2xl border p-6 shadow-sm ${
                isCorrect ? 'border-green-200' : 'border-red-200'
              }`}
            >
              <p className="font-medium text-gray-900 mb-3">
                {index + 1}. {q.question_text}
              </p>
              {q.options.map((option) => {
                const isChosen = option === chosen
                const isAnswer = option === correct
                let style = 'border-gray-100 text-gray-500'
                if (isAnswer) style = 'border-green-400 bg-green-50 text-green-700 font-medium'
                else if (isChosen && !isCorrect) style = 'border-red-400 bg-red-50 text-red-700'

                return (
                  <div
                    key={option}
                    className={`px-4 py-2.5 rounded-xl border text-sm mb-2 ${style}`}
                  >
                    {option}
                    {isAnswer && ' ✓'}
                    {isChosen && !isCorrect && ' ✗'}
                  </div>
                )
              })}
            </div>
          )
        })}

      </div>
    </div>
  )
}
