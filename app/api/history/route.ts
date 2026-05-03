import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerSupabaseClient()

  const { data: attempts, error } = await supabase
    .from('attempts')
    .select(`
      id,
      score,
      created_at,
      quiz_id,
      answers,
      quizzes (
        notes_text
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('History fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }

  // Calculate weak topics: questions answered wrong across all attempts
  const allQuizIds = [...new Set(attempts?.map(a => a.quiz_id) || [])]

  const { data: questions } = await supabase
    .from('questions')
    .select('id, question_text, correct_answer, quiz_id')
    .in('quiz_id', allQuizIds.length > 0 ? allQuizIds : ['none'])

  // Find questions the user got wrong
  const wrongQuestions: string[] = []
  attempts?.forEach(attempt => {
    const answers = attempt.answers as Record<string, string>
    questions?.forEach(q => {
      if (q.quiz_id === attempt.quiz_id && answers[q.id] !== q.correct_answer) {
        wrongQuestions.push(q.question_text)
      }
    })
  })

  return NextResponse.json({ attempts, weakTopics: wrongQuestions.slice(0, 5) })
}
