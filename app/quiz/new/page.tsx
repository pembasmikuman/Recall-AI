'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewQuizPage() {
  const router = useRouter()
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerate() {
    if (notes.trim().length < 20) {
      setError('Please enter at least a few sentences of notes.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      router.push(`/quiz/${data.quizId}`)
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Generate a Quiz</h1>
        <p className="text-gray-500 text-sm mb-6">
          Paste your study notes below. We'll turn them into 5 quiz questions.
        </p>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Paste your notes here... (e.g. lecture notes, textbook summaries, anything you're studying)"
          className="w-full h-56 p-4 border border-gray-200 rounded-xl text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />

        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 rounded-xl transition-colors"
        >
          {loading ? 'Generating your quiz...' : 'Generate Quiz →'}
        </button>

        {loading && (
          <p className="text-center text-gray-400 text-xs mt-3">
            This usually takes 5–10 seconds
          </p>
        )}
      </div>
    </div>
  )
}
