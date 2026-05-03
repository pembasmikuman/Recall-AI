# Recall AI

Paste study notes → get a 5-question MCQ quiz → track weak topics over time.

## Stack

- **Next.js 15** — App Router, TypeScript, Turbopack
- **Tailwind CSS v4**
- **Clerk v6** — authentication
- **Supabase** — Postgres (quizzes, questions, attempts)
- **Prisma v5** — User table (Clerk mirror)
- **OpenRouter** — AI quiz generation (`openrouter/free` model)

## How It Works

1. Paste study notes at `/quiz/new`
2. OpenRouter generates 5 multiple-choice questions
3. Take the quiz, submit answers
4. Dashboard shows past scores and weak topics (questions answered wrong across all attempts)

## Prerequisites

- Node.js 20+
- [Clerk](https://clerk.com) account
- [Supabase](https://supabase.com) project with these tables: `quizzes`, `questions`, `attempts`
- [OpenRouter](https://openrouter.ai) API key

## Setup

```bash
# 1. Clone
git clone <your-repo-url>
cd RecallAI

# 2. Install
npm install --legacy-peer-deps

# 3. Configure environment
cp .env.example .env.local
# Fill in all values in .env.local

# 4. Generate Prisma client
npx prisma generate

# 5. Run migrations
npx prisma migrate dev --name init

# 6. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `DATABASE_URL` | Supabase → Database → Connection Pooling (port 6543) |
| `DIRECT_URL` | Supabase → Database → Direct connection (port 5432) |
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) |

## Folder Structure

```
app/
  page.tsx                        # Landing page
  layout.tsx                      # Root layout with ClerkProvider
  sign-in/[[...sign-in]]/         # Clerk sign-in
  sign-up/[[...sign-up]]/         # Clerk sign-up
  dashboard/                      # Past quizzes + weak topics
  quiz/
    new/                          # Paste notes, generate quiz
    [id]/                         # Take a quiz
    [id]/results/                 # View attempt results
  api/
    generate/                     # POST: generate quiz from notes via OpenRouter
    attempt/                      # POST: submit answers, calculate score
    history/                      # GET: past attempts + weak topics
    quiz/[id]/                    # GET: fetch quiz questions
    results/[attemptId]/          # GET: fetch attempt result
lib/
  db.ts                           # Prisma client singleton
  types.ts                        # Shared TypeScript types
  actions/user.ts                 # Server action: upsert Clerk user to DB
  supabase/
    client.ts                     # Browser Supabase client
    server.ts                     # Server Supabase client (service role)
prisma/
  schema.prisma                   # User model (Clerk mirror)
middleware.ts                     # Clerk route protection
```

## Supabase Schema

Three tables needed (create manually or via SQL):

```sql
create table quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  notes_text text not null,
  created_at timestamptz default now()
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id),
  question_text text not null,
  options jsonb not null,
  correct_answer text not null
);

create table attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id),
  user_id text not null,
  score int not null,
  answers jsonb not null,
  created_at timestamptz default now()
);
```

## Auth Flow

1. `middleware.ts` protects `/dashboard` and `/quiz/*` — unauthenticated users redirect to `/sign-in`
2. On first dashboard load, `ensureUserInDB()` upserts the Clerk user into Prisma `User` table
3. All quiz/attempt data goes through Supabase directly (scoped by Clerk `userId`)
