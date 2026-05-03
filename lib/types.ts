export type Question = {
  id: string
  quiz_id: string
  question_text: string
  options: string[]        // ["Paris", "London", "Berlin", "Rome"]
  correct_answer: string   // "Paris"
}

export type Quiz = {
  id: string
  user_id: string
  notes_text: string
  created_at: string
  questions?: Question[]
}

export type Attempt = {
  id: string
  quiz_id: string
  user_id: string
  score: number
  answers: Record<string, string>  // { [question_id]: chosen_answer }
  created_at: string
  quiz?: Quiz
}

// What the AI returns — before we save to DB
export type GeneratedQuestion = {
  question_text: string
  options: string[]
  correct_answer: string
}
