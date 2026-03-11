import { ref } from 'vue'
import { useDisplay } from 'vuetify'
import { clientEmailSending } from '@/utils/supabase'

export interface SendMessageProps {
  name: string
  email: string
  subject: string
  message: string
}

export function useContact() {
  const { mobile, lgAndUp } = useDisplay()
  const mapRef = ref<HTMLDivElement | null>(null)
  const lat = 8.949607490217725
  const lng = 125.52513812447586

  const alertVisible = ref(false)
  const alertMessage = ref('')
  const alertStatus = ref(0)

  async function sendMessage(values: SendMessageProps) {
    const { data } = await clientEmailSending(values)
    return data
  }

  return {
    mapRef,
    lat,
    lng,
    mobile,
    lgAndUp,
    sendMessage,
    alertVisible,
    alertMessage,
    alertStatus,
  }
}
