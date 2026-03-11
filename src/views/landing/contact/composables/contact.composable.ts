import { ref } from 'vue'
import { useDisplay } from 'vuetify'
import { clientEmailSending } from '@/utils/supabase'
import { useForm, type GenericObject } from 'vee-validate'
import * as yup from 'yup'

export interface SendMessageProps {
  name: string
  email: string
  subject: string
  message: string
}

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  subject: yup.string().required('Subject is required'),
  message: yup
    .string()
    .min(10, 'Message must be at least 10 characters')
    .required('Message is required'),
})

export function useContact() {
  const { mobile, lgAndUp } = useDisplay()
  const mapRef = ref<HTMLDivElement | null>(null)
  const lat = 8.949607490217725
  const lng = 125.52513812447586

  const isVisible = ref(false)
  const alertVisible = ref(false)
  const alertMessage = ref('')
  const alertStatus = ref(0)

  const { handleSubmit, defineField, errors, resetForm } = useForm<SendMessageProps>({
    validationSchema: schema,
  })

  const [name, nameAttrs] = defineField('name')
  const [email, emailAttrs] = defineField('email')
  const [subject, subjectAttrs] = defineField('subject')
  const [message, messageAttrs] = defineField('message')

  async function sendMessage(values: SendMessageProps) {
    const { data } = await clientEmailSending(values)
    return data
  }

  const onSubmit = handleSubmit(async (values: GenericObject & SendMessageProps) => {
    const data = await sendMessage(values)

    alertMessage.value = data?.success
      ? 'Message sent! We will get back to you shortly.'
      : 'Failed to send message. Please try again later.'
    alertStatus.value = data?.success ? 200 : 500
    alertVisible.value = true

    if (data?.success) resetForm()
  })

  return {
    mapRef,
    lat,
    lng,
    mobile,
    lgAndUp,
    isVisible,
    alertVisible,
    alertMessage,
    alertStatus,
    errors,
    name,
    nameAttrs,
    email,
    emailAttrs,
    subject,
    subjectAttrs,
    message,
    messageAttrs,
    onSubmit,
  }
}
