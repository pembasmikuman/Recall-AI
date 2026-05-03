import { currentUser } from '@clerk/nextjs/server'

// We use Clerk for identity — no need to sync users to a separate DB table.
// This function is kept so existing imports don't break.
export async function ensureUserInDB() {
  const user = await currentUser()
  if (!user) throw new Error('Not authenticated')
  return user
}
