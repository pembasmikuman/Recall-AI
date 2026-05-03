import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { quizId, answers } = await req.json()
  // answers = { [question_id]: chosen_answer }

  if (!quizId || !answers) {
    return NextResponse.json({ error: 'Missing quizId or answers' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  // Fetch correct answers for this quiz
  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('id, correct_answer')
    .eq('quiz_id', quizId)

  if (qError || !questions) {
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }

  // Calculate score
  const score = questions.reduce((acc, q) => {
    return answers[q.id] === q.correct_answer ? acc + 1 : acc
  }, 0)

  // Save attempt
  const { data: attempt, error: aError } = await supabase
    .from('attempts')
    .insert({ quiz_id: quizId, user_id: userId, score, answers })
    .select()
    .single()

  if (aError || !attempt) {
    console.error('Attempt insert error:', aError)
    return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 })
  }

  return NextResponse.json({ attemptId: attempt.id, score, total: questions.length })
}
