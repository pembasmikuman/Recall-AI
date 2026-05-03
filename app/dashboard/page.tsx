'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

type Attempt = {
  id: string
  score: number
  created_at: string
  quiz_id: string
  quizzes: { notes_text: string }
}

export default function DashboardPage() {
  const router = useRouter()
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [weakTopics, setWeakTopics] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/history')
        const data = await res.json()
        if (res.ok) {
          setAttempts(data.attempts || [])
          setWeakTopics(data.weakTopics || [])
        }
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1">Recall AI</p>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/quiz/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              New Quiz
            </button>
            <UserButton />
          </div>
        </div>

        {/* Weak topics */}
        {weakTopics.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <h2 className="font-semibold text-amber-800 mb-3">⚠ Weak Topics</h2>
            <p className="text-amber-700 text-sm mb-3">Questions you've gotten wrong:</p>
            <ul className="space-y-2">
              {weakTopics.map((topic, i) => (
                <li key={i} className="text-sm text-amber-700 bg-amber-100 rounded-lg px-3 py-2">
                  {topic}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* History */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Past Quizzes</h2>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : attempts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">No quizzes yet.</p>
              <button
                onClick={() => router.push('/quiz/new')}
                className="mt-4 text-blue-600 text-sm font-medium hover:underline"
              >
                Generate your first quiz →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {attempts.map((attempt) => {
                const preview = attempt.quizzes?.notes_text?.slice(0, 80) + '...'
                const date = new Date(attempt.created_at).toLocaleDateString()
                return (
                  <div
                    key={attempt.id}
                    onClick={() => router.push(`/quiz/${attempt.quiz_id}/results?attemptId=${attempt.id}`)}
                    className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:border-blue-300 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-blue-600 font-bold">{attempt.score}/5</span>
                      <span className="text-gray-400 text-xs">{date}</span>
                    </div>
                    <p className="text-gray-500 text-sm truncate">{preview}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
