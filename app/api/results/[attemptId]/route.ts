import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { attemptId } = await params
  const supabase = createServerSupabaseClient()

  const { data: attempt, error: aError } = await supabase
    .from('attempts')
    .select('*')
    .eq('id', attemptId)
    .eq('user_id', userId)
    .single()

  if (aError || !attempt) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
  }

  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', attempt.quiz_id)

  if (qError || !questions) {
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }

  return NextResponse.json({
    score: attempt.score,
    total: questions.length,
    answers: attempt.answers,
    questions,
  })
}
