import { createClient } from '@supabase/supabase-js'
import { type SendMessageProps } from '@/views/landing/contact/composables/contact.composable'

// 👉 Create a single supabase client for interacting with your database
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

// 👉 Create a single supabase admin client for interacting auth users
export const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

// 👉 Type for Email Payload
export type EmailPayload = {
  email: string
  subject: string
  message: string
}

// 👉 Trigger Edge functions on email sending
export const onEmailNotification = async (payload: EmailPayload) => {
  return await supabase.functions.invoke('send-notification', {
    body: payload,
  })
}

export const clientEmailSending = async (payload: SendMessageProps) => {
  return await supabase.functions.invoke('send-client-email', {
    body: payload,
  })
}