import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GeneratedQuestion } from '@/lib/types'

export async function POST(req: NextRequest) {
  // 1. Auth check
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Get notes from request body
  const { notes } = await req.json()
  if (!notes || notes.trim().length < 20) {
    return NextResponse.json({ error: 'Notes too short' }, { status: 400 })
  }

  // 3. Call Ollama Cloud
  const prompt = `You are a quiz generator. Given the following study notes, generate exactly 5 multiple choice quiz questions to test understanding.

RULES:
- Each question must have exactly 4 options labeled A, B, C, D
- The correct_answer field must be the FULL TEXT of the correct option (not just the letter)
- Return ONLY valid JSON, no explanation, no markdown, no extra text
- The JSON must match this exact structure:

{
  "questions": [
    {
      "question_text": "What is ...?",
      "options": ["option A text", "option B text", "option C text", "option D text"],
      "correct_answer": "option A text"
    }
  ]
}

STUDY NOTES:
${notes}`

  let generatedQuestions: GeneratedQuestion[]

  try {
    const ollamaRes = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json','Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            }
            ,body: JSON.stringify({
                model: 'openrouter/free',stream: false,messages: [{
                    role: 'user', content: prompt
                }],
            }),
        })

    if (!ollamaRes.ok) {
      const err = await ollamaRes.text()
      console.error('Ollama error:', err)
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
    }

    const ollamaData = await ollamaRes.json()
    const rawContent = ollamaData.choices?.[0]?.message?.content ?? ''

    // Strip markdown fences if model wraps in ```json ... ```
    const cleaned = rawContent.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    generatedQuestions = parsed.questions

    if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
      throw new Error('Invalid question format from model')
    }
  } catch (err) {
    console.error('Parse/generation error:', err)
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }

  // 4. Save to Supabase
  const supabase = createServerSupabaseClient()

  // Insert quiz
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({ user_id: userId, notes_text: notes })
    .select()
    .single()

  if (quizError || !quiz) {
    console.error('Quiz insert error:', quizError)
    return NextResponse.json({ error: 'Failed to save quiz' }, { status: 500 })
  }

  // Insert questions
  const questionsToInsert = generatedQuestions.map((q) => ({
    quiz_id: quiz.id,
    question_text: q.question_text,
    options: q.options,
    correct_answer: q.correct_answer,
  }))

  const { error: questionsError } = await supabase
    .from('questions')
    .insert(questionsToInsert)

  if (questionsError) {
    console.error('Questions insert error:', questionsError)
    return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 })
  }

  // 5. Return quiz id — frontend will redirect to /quiz/[id]
  return NextResponse.json({ quizId: quiz.id })
}
