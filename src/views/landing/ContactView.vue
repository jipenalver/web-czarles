<script setup lang="ts">
import { onMounted, ref } from 'vue'
import LandingLayout from '@/components/landing/LandingLayout.vue'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const mapRef = ref<HTMLDivElement | null>(null)
const lat = 8.949607490217725
const lng = 125.52513812447586

const name = ref('')
const email = ref('')
const subject = ref('')
const message = ref('')

const isVisible = ref(false)

function sendMessage() {
  // Minimal submit handler — adapt to your API later
  console.log('send message', {
    name: name.value,
    email: email.value,
    subject: subject.value,
    message: message.value,
  })
  name.value = ''
  email.value = ''
  subject.value = ''
  message.value = ''
}

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
  <LandingLayout :hideBg="true">
    <template #hero>
      <div class="text-center white--text" style="max-width: 900px">
        <div class="hero-content" :class="{ 'animate-fade-in': isVisible }">
          <h1 class="text-h3 lg:text-h2 font-weight-bold mb-4 text-white animate-slide-up">Contact</h1>
          <p class="mb-6 text-h6 text-white font-weight-light animate-slide-up delay-1">
            Get in touch with our team for inquiries, support, or partnerships.
          </p>
          <div class="text-caption text-white animate-slide-up delay-2">
            <v-icon size="small" class="mr-1 text-orange-lighten-2">mdi-home</v-icon>
            <RouterLink to="/" class="text-white text-decoration-none hover-orange">Home</RouterLink>
            <v-icon size="small" class="mx-2">mdi-chevron-right</v-icon>
            <span class="text-orange-lighten-2">Contact</span>
          </div>
        </div>
      </div>
    </template>

    <template #content>
      <v-container class="pa-5">
        <v-row class="justify-center">
          <v-col cols="0" lg="2"></v-col>
          <v-col cols="12" md="6" lg="4">
            <v-card class="pa-0 elevation-2 rounded-lg overflow-hidden">
              <div ref="mapRef" id="map" class="map" />
            </v-card>
          </v-col>

          <v-col cols="12" md="6" lg="4">
            <v-row class="mb-4" dense>
              <v-col cols="12" md="6">
                <v-card class="pa-4 info-card" elevation="1">
                  <div class="info-left">
                    <div class="icon-circle"><v-icon color="orange">mdi-map-marker</v-icon></div>
                  </div>
                  <div>
                    <div class="caption text-caption">Location</div>
                    <div class="body-2 text-body-2">Butuan City, Agusan del Norte, Philippines</div>
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card class="pa-4 info-card" elevation="1">
                  <div class="info-left">
                    <div class="icon-circle"><v-icon color="orange">mdi-email-outline</v-icon></div>
                  </div>
                  <div>
                    <div class="caption text-caption">Email</div>
                    <div class="body-2 text-body-2">czarlesconst@yahoo.com</div>
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card class="pa-4 info-card" elevation="1">
                  <div class="info-left">
                    <div class="icon-circle"><v-icon color="orange">mdi-phone</v-icon></div>
                  </div>
                  <div>
                    <div class="caption text-caption">Call</div>
                    <div class="body-2 text-body-2">+63 93 992 590 380</div>
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card class="pa-4 info-card" elevation="1">
                  <div class="info-left">
                    <div class="icon-circle"><v-icon color="orange">mdi-clock-outline</v-icon></div>
                  </div>
                  <div>
                    <div class="caption text-caption">Open Hours</div>
                    <div class="body-2 text-body-2">Monday–Friday: 9AM - 6PM</div>
                  </div>
                </v-card>
              </v-col>
            </v-row>

            <v-card class="pa-6 contact-form-card" elevation="2">
              <div class="mb-4 display-1 font-weight-bold text-h6">Get in Touch</div>
              <div class="text-body-1 mb-4 text-body-2">
                Lorem ipsum dolor sit amet consectetur adipisicing elit sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua consectetur adipiscing.
              </div>

              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="name"
                    label="Your Name"
                    hide-details
                    dense
                    outlined
                    class="text-body-2"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="email"
                    label="Your Email"
                    hide-details
                    dense
                    outlined
                    class="text-body-2"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="subject"
                    label="Subject"
                    hide-details
                    dense
                    outlined
                    class="text-body-2"
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="message"
                    label="Message"
                    rows="5"
                    hide-details
                    outlined
                    class="text-body-2"
                  />
                </v-col>
                <v-col cols="12" class="d-flex align-center justify-space-between">
                  <v-btn color="orange" class="white--text" @click="sendMessage"
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
          <v-col cols="0" lg="2"></v-col>
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
  from { opacity: 0 }
  to { opacity: 1 }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px) }
  to { opacity: 1; transform: translateY(0) }
}

.hover-orange:hover {
  color: #ff6b35 !important;
}
</style>
