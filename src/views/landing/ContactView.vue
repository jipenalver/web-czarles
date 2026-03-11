<script setup lang="ts">
import { onMounted, ref } from 'vue'
import LandingLayout from '@/components/landing/LandingLayout.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useHeroComputed } from '@/utils/helpers/style'
import { useForm, type GenericObject } from 'vee-validate'
import * as yup from 'yup'
import { useContact, type SendMessageProps } from '@/views/landing/contact/composables/contact.composable'

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  subject: yup.string().required('Subject is required'),
  message: yup.string().min(10, 'Message must be at least 10 characters').required('Message is required'),
})

const { handleSubmit, defineField, errors, resetForm } = useForm<SendMessageProps>({ validationSchema: schema })

const heroComputed = useHeroComputed()
const { mapRef, lat, lng, mobile, sendMessage } = useContact()

const alertVisible = ref(false)
const alertMessage = ref('')
const alertStatus = ref(0)

const onSubmit = handleSubmit(async (values: GenericObject & SendMessageProps) => {
  const data = await sendMessage(values)

  alertMessage.value = data?.success ? 'Message sent! We will get back to you shortly.' : 'Failed to send message. Please try again later.'
  alertStatus.value = data?.success ? 200 : 500
  alertVisible.value = true

  if (data?.success) resetForm()
})

const isVisible = ref(false)

const [name, nameAttrs] = defineField('name')
const [email, emailAttrs] = defineField('email')
const [subject, subjectAttrs] = defineField('subject')
const [message, messageAttrs] = defineField('message')

onMounted(() => {
  // trigger hero animation
  setTimeout(() => {
    isVisible.value = true
  }, 300)
  if (!mapRef.value) return
  const map = L.map(mapRef.value, { zoomControl: true, attributionControl: false }).setView(
    [lat, lng],
    15,
  )

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  // use a custom SVG pin to avoid default icon asset issues
  const pinSvg = `
    <svg width="46" height="58" viewBox="0 0 46 58" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23 0C14.1634 0 7 7.16344 7 16C7 28 23 58 23 58C23 58 39 28 39 16C39 7.16344 31.8366 0 23 0Z" fill="#ff6f00"/>
      <circle cx="23" cy="16" r="7" fill="#ffffff" opacity="0.95"/>
    </svg>
  `
  // embed as data URI (encode to ensure valid URL chars)
  const pinDataUri = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(pinSvg)
  const pinHtml = `<img src="${pinDataUri}" style="width:46px;height:58px;display:block;" alt="pin" />`
  const pinIcon = L.divIcon({
    html: pinHtml,
    className: 'custom-pin',
    iconSize: [46, 58],
    iconAnchor: [23, 58],
  })
  L.marker([lat, lng], { icon: pinIcon }).addTo(map).bindPopup('Our Location')

  // Ensure map renders inside hidden containers / layout transitions
  setTimeout(() => map.invalidateSize(), 200)
})
</script>

<template>
  <AppAlert
    :isAlertVisible="alertVisible"
    :formMessage="alertMessage"
    :formStatus="alertStatus"
    @update:isAlertVisible="alertVisible = $event"
  />
  <LandingLayout :hideBg="true">
    <template #hero>
      <div class="text-center white--text" style="max-width: 900px">
        <div class="hero-content" :class="{ 'animate-fade-in': isVisible }">
          <h1
            :class="[heroComputed.titleClass, 'font-weight-bold', 'mb-4', 'text-white', 'animate-slide-up']"
          >
            Contact
          </h1>
          <p
            :class="[
              heroComputed.subtitleClass,
              'mb-6',
              'text-white',
              'font-weight-light',
              'animate-slide-up',
              'delay-1',
            ]"
          >
            Get in touch with our team for inquiries, support, or partnerships.
          </p>
          <div class="text-caption text-white animate-slide-up delay-2">
            <v-icon size="small" class="mr-1 text-orange-lighten-2">mdi-home</v-icon>
            <RouterLink to="/" class="text-white text-decoration-none hover-orange"
              >Home</RouterLink
            >
            <v-icon size="small" class="mx-2">mdi-chevron-right</v-icon>
            <span class="text-orange-lighten-2">Contact</span>
          </div>
        </div>
      </div>
    </template>

    <template #content>
      <v-container class="pa-5">
        <v-row class="justify-center">
          <v-col cols="12" md="6" lg="6">
            <v-card class="pa-0 elevation-2 rounded-lg overflow-hidden">
              <div ref="mapRef" id="map" class="map" />
            </v-card>
          </v-col>

          <v-col cols="12" md="6" lg="6">
            <v-row class="mb-4" dense>
              <v-col cols="12" md="6">
                <v-card :class="[heroComputed.cardPadding, 'info-card']" elevation="1">
                  <div class="info-left">
                    <div class="icon-circle"><v-icon color="orange">mdi-map-marker</v-icon></div>
                  </div>
                  <div>
                    <div :class="[mobile ? 'text-caption' : 'text-caption']">Location</div>
                    <div :class="[mobile ? 'text-caption' : 'text-body-2']">
                      Butuan City, Agusan del Norte, Philippines
                    </div>
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card :class="[heroComputed.cardPadding, 'info-card']" elevation="1">
                  <div class="info-left">
                    <div class="icon-circle"><v-icon color="orange">mdi-email-outline</v-icon></div>
                  </div>
                  <div>
                    <div :class="[mobile ? 'text-caption' : 'text-caption']">Email</div>
                    <div :class="[mobile ? 'text-caption' : 'text-body-2']">
                      czarlesconst@yahoo.com
                    </div>
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card :class="[heroComputed.cardPadding, 'info-card']" elevation="1">
                  <div class="info-left">
                    <div class="icon-circle"><v-icon color="orange">mdi-phone</v-icon></div>
                  </div>
                  <div>
                    <div :class="[mobile ? 'text-caption' : 'text-caption']">Call</div>
                    <div :class="[mobile ? 'text-caption' : 'text-body-2']">+63 93 992 590 380</div>
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card :class="[heroComputed.cardPadding, 'info-card']" elevation="1">
                  <div class="info-left">
                    <div class="icon-circle"><v-icon color="orange">mdi-clock-outline</v-icon></div>
                  </div>
                  <div>
                    <div :class="[mobile ? 'text-caption' : 'text-caption']">Open Hours</div>
                    <div :class="[mobile ? 'text-caption' : 'text-body-2']">
                      Monday–Friday: 9AM - 6PM
                    </div>
                  </div>
                </v-card>
              </v-col>
            </v-row>

            <v-card :class="[heroComputed.cardPadding, 'contact-form-card']" elevation="2">
              <div :class="[heroComputed.contentTitleClass, 'mb-4', 'font-weight-bold']">Get in Touch</div>
              <div :class="[heroComputed.bodyTextClass, 'mb-4']">
                Have a project in mind or need a quote? Fill out the form and our team will get
                back to you as soon as possible.
              </div>

              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="name"
                    v-bind="nameAttrs"
                    :error-messages="errors.name"
                    label="Your Name"
                    dense
                    outlined
                    class="text-body-2"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="email"
                    v-bind="emailAttrs"
                    :error-messages="errors.email"
                    label="Your Email"
                    dense
                    outlined
                    class="text-body-2"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="subject"
                    v-bind="subjectAttrs"
                    :error-messages="errors.subject"
                    label="Subject"
                    dense
                    outlined
                    class="text-body-2"
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="message"
                    v-bind="messageAttrs"
                    :error-messages="errors.message"
                    label="Message"
                    rows="4"
                    outlined
                    class="text-body-2"
                  />
                </v-col>
                <v-col cols="12" class="d-flex align-center justify-space-between">
                  <v-btn color="orange" class="white--text" @click="onSubmit"
                    >Send Message</v-btn
                  >
                  <div class="socials">
                    <v-icon small class="mx-2">mdi-twitter</v-icon>
                    <v-icon small class="mx-2">mdi-facebook</v-icon>
                    <v-icon small class="mx-2">mdi-instagram</v-icon>
                    <v-icon small class="mx-2">mdi-linkedin</v-icon>
                  </div>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </LandingLayout>
</template>

<style scoped>
.map {
  width: 100%;
  height: clamp(720px, 45vh, 720px);
  border-radius: 12px;
}
.info-card {
  display: flex;
  gap: 12px;
  align-items: center;
  height: 5rem;
}
.icon-circle {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: rgba(255, 111, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}
.caption {
  font-weight: 600;
  margin-bottom: 4px;
}
.socials .v-icon {
  color: rgba(0, 0, 0, 0.6);
  font-size: 16px; /* smaller social icons */
  line-height: 1;
}

/* Hero animations (match AboutView) */
.animate-fade-in {
  animation: fadeIn 0.8s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.8s ease-out;
}

.delay-1 {
  animation-delay: 0.2s;
  animation-fill-mode: both;
}

.delay-2 {
  animation-delay: 0.4s;
  animation-fill-mode: both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hover-orange:hover {
  color: #ff6b35 !important;
}
</style>
