<script setup lang="ts">
import LandingLayout from '@/components/landing/LandingLayout.vue'
import { ref, onMounted } from 'vue'

const isVisible = ref(false)

onMounted(() => {
  isVisible.value = true
})
</script>

<template>
  <LandingLayout :hideBg="true">
    <template #hero>
      <div
        class="text-center white--text animate-hero-container"
        :class="{ 'animate-hero-container-visible': isVisible }"
        style="max-width: 900px"
      >
        <div class="hero-content">
          <h1
            class="text-h3 lg:text-h2 font-weight-bold mb-4 text-white animate-hero-title"
            :class="{ 'animate-hero-title-visible': isVisible }"
          >
            Terms & Conditions
          </h1>
          <p
            class="mb-6 text-h6 text-white font-weight-light animate-hero-subtitle"
            :class="{ 'animate-hero-subtitle-visible': isVisible }"
          >
            Please read and understand our Terms & Conditions — they outline your rights,
            responsibilities, and how we collect and use data while using our services.
          </p>
        </div>

        <div
          class="text-caption text-white animate-hero-breadcrumb"
          :class="{ 'animate-hero-breadcrumb-visible': isVisible }"
        >
          <v-icon size="small" class="mr-1 text-orange-lighten-2">mdi-home</v-icon>
          <RouterLink to="/" class="text-white text-decoration-none hover-orange">Home</RouterLink>
          <span class="mx-2 text-white">/</span>
          <span class="text-white">Terms & Conditions</span>
        </div>
      </div>
    </template>
    <template #content>
      <v-container class="py-12" fluid>
        <v-row justify="center">
          <v-col cols="12" lg="10" xl="8">
            <v-card class="pa-8 ma-4" outlined>
              <div class="terms-conditions-content">
                <h2 class="text-h4 mb-6 text-primary">Terms and Conditions</h2>
                
                <p class="mb-6 text-body-2">
                  <strong>Last updated:</strong> August 25, 2025
                </p>

                <section class="mb-6">
                  <h3 class="text-h6 mb-3 font-weight-bold text-primary">1. Acceptance of Terms</h3>
                  <p class="mb-4">
                    By downloading, installing, or using the Czarles Mobile App ("the App"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, do not use the App.
                  </p>
                </section>

                <section class="mb-6">
                  <h3 class="text-h6 mb-3 font-weight-bold text-primary">2. Description of Service</h3>
                  <p class="mb-3">The Czarles Mobile App is an employee attendance management application that provides:</p>
                  <ul class="mb-4">
                    <li>Location-based attendance tracking using GPS</li>
                    <li>Time clock functionality for work hours</li>
                    <li>Image capture for attendance verification</li>
                    <li>Offline attendance recording with automatic synchronization</li>
                    <li>Real-time data sync when internet connectivity is available</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h6 mb-3 font-weight-bold text-primary">3. User Accounts and Authentication</h3>
                  <ul class="mb-4">
                    <li>Users must provide a valid phone number for account registration and authentication</li>
                    <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                    <li>You must notify us immediately of any unauthorized use of your account</li>
                    <li>One account per employee - sharing accounts is prohibited</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h6 mb-3 font-weight-bold text-primary">4. Acceptable Use</h3>
                  <p class="mb-3">You agree to use the App only for legitimate attendance tracking purposes. You must NOT:</p>
                  <ul class="mb-4">
                    <li>Attempt to manipulate or falsify location data</li>
                    <li>Use fake GPS or location spoofing applications</li>
                    <li>Share your account credentials with others</li>
                    <li>Attempt to circumvent security measures</li>
                    <li>Use the App for any illegal or unauthorized purposes</li>
                    <li>Interfere with or disrupt the App's functionality</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h6 mb-3 font-weight-bold text-primary">5. Location Services and Data Collection</h3>
                  <ul class="mb-4">
                    <li>The App requires access to your device's GPS location for attendance verification</li>
                    <li>Location data is collected only during attendance check-in/check-out processes</li>
                    <li>The App includes fake location detection to ensure data integrity</li>
                    <li>By using the App, you consent to location data collection as described in our Privacy Policy</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h6 mb-3 font-weight-bold text-primary">6. Camera and Image Capture</h3>
                  <ul class="mb-4">
                    <li>The App may require camera access for attendance verification photos</li>
                    <li>Images are captured and stored securely for attendance record purposes</li>
                    <li>You grant us the right to use captured images for attendance verification and record-keeping</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h6 mb-3 font-weight-bold text-primary">7. Offline Functionality</h3>
                  <ul class="mb-4">
                    <li>The App can function offline and will sync data when connectivity is restored</li>
                    <li>You are responsible for ensuring data accuracy during offline use</li>
                    <li>Offline data will be automatically synchronized when internet connection is available</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h6 mb-3 font-weight-bold text-primary">8. Data Accuracy and Integrity</h3>
                  <ul class="mb-4">
                    <li>You are responsible for the accuracy of your attendance records</li>
                    <li>Any attempts to manipulate attendance data may result in account suspension</li>
                    <li>The App implements security measures to detect and prevent fraudulent activity</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h6 mb-3 font-weight-bold text-primary">9. Intellectual Property Rights</h3>
                  <ul class="mb-4">
                    <li>The App and its content are owned by C'Zarles Construction and Supplies and protected by copyright and other intellectual property laws</li>
                    <li>You may not copy, modify, distribute, or reverse engineer the App</li>
                    <li>All trademarks and logos are the property of their respective owners</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h6 mb-3 font-weight-bold text-primary">10. Limitation of Liability</h3>
                  <ul class="mb-4">
                    <li>The App is provided "as is" without warranties of any kind</li>
                    <li>We are not liable for any indirect, incidental, or consequential damages</li>
                    <li>Our total liability shall not exceed the amount paid for using the App (if any)</li>
                    <li>We are not responsible for data loss due to device malfunction or user error</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h6 mb-3 font-weight-bold text-primary">11. Service Availability</h3>
                  <ul class="mb-4">
                    <li>We strive to maintain App availability but do not guarantee uninterrupted service</li>
                    <li>We may temporarily suspend service for maintenance or updates</li>
                    <li>We reserve the right to modify or discontinue features with reasonable notice</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h6 mb-3 font-weight-bold text-primary">12. Updates and Modifications</h3>
                  <ul class="mb-4">
                    <li>We may update the App to improve functionality, security, or compliance</li>
                    <li>Continued use after updates constitutes acceptance of changes</li>
                    <li>We reserve the right to modify these Terms with 30 days' notice</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h6 mb-3 font-weight-bold text-primary">13. Account Termination</h3>
                  <p class="mb-3">We may suspend or terminate your account if you:</p>
                  <ul class="mb-4">
                    <li>Violate these Terms and Conditions</li>
                    <li>Attempt to manipulate attendance data</li>
                    <li>Use the App for unauthorized purposes</li>
                    <li>Fail to comply with your employer's policies</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h6 mb-3 font-weight-bold text-primary">14. Third-Party Services</h3>
                  <ul class="mb-4">
                    <li>The App may integrate with third-party services (mapping, cloud storage, etc.)</li>
                    <li>Third-party services are governed by their own terms and conditions</li>
                    <li>We are not responsible for third-party service availability or performance</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h6 mb-3 font-weight-bold text-primary">15. Compliance with Laws</h3>
                  <ul class="mb-4">
                    <li>You must comply with all applicable local, state, and federal laws while using the App</li>
                    <li>You are responsible for ensuring your use complies with employment regulations</li>
                    <li>The App is designed to assist with legal attendance tracking practices</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h6 mb-3 font-weight-bold text-primary">16. Data Retention and Deletion</h3>
                  <ul class="mb-4">
                    <li>Attendance records are retained as required by employment law and company policy</li>
                    <li>You may request account deletion, subject to legal and business requirements</li>
                    <li>Some data may be retained for legal compliance even after account deletion</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h6 mb-3 font-weight-bold text-primary">17. Support and Contact</h3>
                  <p class="mb-3">For technical support or questions about these Terms:</p>
                  <ul class="mb-4">
                    <li><strong>Email:</strong> czarlesconst0897@gmail.com</li>
                    <li><strong>Phone:</strong> +639399359038</li>
                    <li><strong>Address:</strong> 360 R. Calo St, Butuan City, Agusan Del Norte</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h6 mb-3 font-weight-bold text-primary">18. Dispute Resolution</h3>
                  <ul class="mb-4">
                    <li>Any disputes will be resolved through binding arbitration in [JURISDICTION]</li>
                    <li>You waive the right to participate in class action lawsuits</li>
                    <li>These Terms are governed by the laws of Philippines</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h6 mb-3 font-weight-bold text-primary">19. Severability</h3>
                  <p class="mb-4">
                    If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
                  </p>
                </section>

                <section class="mb-6">
                  <h3 class="text-h6 mb-3 font-weight-bold text-primary">20. Entire Agreement</h3>
                  <p class="mb-4">
                    These Terms, along with our Privacy Policy, constitute the entire agreement between you and C'Zarles Construction and Supplies regarding the use of the App.
                  </p>
                </section>

                <v-divider class="my-6"></v-divider>

                <section class="mb-6">
                  <h3 class="text-h6 mb-3 font-weight-bold text-primary">Company Information</h3>
                  <ul class="mb-4">
                    <li><strong>Company Name:</strong> C'Zarles Construction and Supplies</li>
                    <li><strong>Address:</strong> 360 R. Calo St, Butuan City, Agusan Del Norte</li>
                    <li><strong>Email:</strong> czarlesconst0897@gmail.com</li>
                    <li><strong>Phone:</strong> +639399359038</li>
                  </ul>
                </section>

                <div class="text-center">
                  <p class="font-weight-bold mb-2">Acknowledgement</p>
                  <p class="text-body-2">
                    By using the Czarles Mobile App, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                  </p>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </LandingLayout>
</template>
<style scoped>
/* Hero Animations */
.animate-hero-container {
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.8s ease-out;
}
.animate-hero-container-visible {
  opacity: 1;
  transform: translateY(0);
}

.animate-hero-title {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s ease-out 0.2s;
}
.animate-hero-title-visible {
  opacity: 1;
  transform: translateY(0);
}

.animate-hero-subtitle {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s ease-out 0.4s;
}
.animate-hero-subtitle-visible {
  opacity: 1;
  transform: translateY(0);
}

.animate-hero-breadcrumb {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.8s ease-out 0.6s;
}
.animate-hero-breadcrumb-visible {
  opacity: 1;
  transform: translateY(0);
}
/* Minimal hero animation: single keyframe, small translate, staggered delays */
.animate-hero-container,
.animate-hero-container .hero-content h1,
.animate-hero-container .hero-content p,
.animate-hero-breadcrumb {
  opacity: 0;
  transform: translateY(12px);
  will-change: opacity, transform;
}

/* visible state on the container triggers child animations with small delays */
.animate-hero-container-visible {
  animation: fadeIn 0.45s ease 0s forwards;
}
.animate-hero-container-visible .hero-content h1 {
  animation: slideUp 0.48s ease 0.08s forwards;
}
.animate-hero-container-visible .hero-content p {
  animation: slideUp 0.48s ease 0.18s forwards;
}
.animate-hero-container-visible .animate-hero-breadcrumb {
  animation: slideUp 0.48s ease 0.28s forwards;
}

@keyframes slideUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fadeIn {
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .animate-hero-container,
  .animate-hero-container .hero-content h1,
  .animate-hero-container .hero-content p,
  .animate-hero-breadcrumb,
  .animate-hero-container-visible {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
</style>
