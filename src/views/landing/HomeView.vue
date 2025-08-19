<script setup lang="ts">
import LandingLayout from '@/components/landing/LandingLayout.vue'
import imageBg from '@/assets/images/image-bg.jpg'
import HomeWidget from './home/HomeWidget.vue'
import PrivacyPolicyView from './legal/PrivacyPolicyView.vue'
import TermsAgreements from './legal/TermsAgreementsView.vue'

</script>

<template>
  <LandingLayout>
    <template #content>
      <div>
        <!-- Home section (tab: #home) -->
        <section id="home">
          <div class="d-flex align-center justify-center landing-parallax" style="height: 100%;">
            <div class="landing-bg" :style="{ backgroundImage: 'url(' + imageBg + ')' }"></div>
            <v-row>
              <v-col cols="0" md="3" lg="3"> </v-col>
              <v-col cols="12" md="6" lg="6">
                <HomeWidget />
              </v-col>
              <v-col cols="0" md="3" lg="3"> </v-col>
            </v-row>
          </div>
        </section>

        <!-- About Us section (tab: #about) -->
        <section id="about" class="mt-12">
          <v-row>
            <v-col cols="12" md="2" lg="2"> </v-col>
            <v-col cols="12" md="8" lg="8">
              <v-card class="pa-6">
                <v-card-title class="text-h5">About Us</v-card-title>
                <v-card-text>
                  <p>
                    We build modern HR and operations tools to help teams manage attendance,
                    payroll, and more. This is a short placeholder — replace with real copy.
                  </p>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="2" lg="2"> </v-col>
          </v-row>
        </section>

        <!-- Company section (tab: #company) -->
        <section id="company" class="mt-12">
          <v-row>
            <v-col cols="12" md="2" lg="2"> </v-col>
            <v-col cols="12" md="8" lg="8">
              <v-card class="pa-6">
                <v-card-title class="text-h5">Company</v-card-title>
                <v-card-text>
                  <p>
                    Company information, mission, and values. Replace this placeholder with
                    the company's content.
                  </p>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="2" lg="2"> </v-col>
          </v-row>
        </section>

        <!-- Contact section (tab: #contact) -->
        <section id="contact" class="mt-12">
          <v-row>
            <v-col cols="12" md="2" lg="2"> </v-col>
            <v-col cols="12" md="8" lg="8">
              <v-card class="pa-6">
                <v-card-title class="text-h5">Contact Us</v-card-title>
                <v-card-text>
                  <p>
                    For inquiries, email <a href="mailto:info@example.com">info@example.com</a>
                    or use the contact form (not implemented here).
                  </p>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="2" lg="2"> </v-col>
          </v-row>
        </section>

        <!-- Terms section (tab: #terms) -->
        <section id="terms" class="mt-12 mb-12">
          <v-row>
            <v-col cols="12" md="2" lg="2"> </v-col>
            <v-col cols="12" md="8" lg="8">
              <v-card class="pa-6">
                <v-card-title class="text-h5">Terms of Service</v-card-title>
                <v-card-text>
                  <TermsAgreements class="my-5" />
                  <PrivacyPolicyView class="my-5" />
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="2" lg="2"> </v-col>
          </v-row>
        </section>
      </div>
    </template>
  </LandingLayout>
</template>

<style scoped>
.landing-parallax::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.landing-parallax {
  position: relative;
  overflow: hidden;
}

.landing-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  will-change: transform;
  transform-origin: center center;
  animation: landing-zoom 25s ease-in-out infinite;
  z-index: 0;
}

/* keep content above the background */
.landing-parallax > *:not(.landing-bg) {
  position: relative;
  z-index: 1;
}

@keyframes landing-zoom {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.25);
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-bg {
    animation: none;
  }
}
</style>
