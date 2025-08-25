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
            Privacy Policy
          </h1>
          <p
            class="mb-6 text-h6 text-white font-weight-light animate-hero-subtitle"
            :class="{ 'animate-hero-subtitle-visible': isVisible }"
          >
            We respect your privacy. This Privacy Policy explains the personal information we
            collect, how we use and protect it, and your rights regarding your data.
          </p>
        </div>

        <div
          class="text-caption text-white animate-hero-breadcrumb"
          :class="{ 'animate-hero-breadcrumb-visible': isVisible }"
        >
          <v-icon size="small" class="mr-1 text-orange-lighten-2">mdi-home</v-icon>
          <RouterLink to="/" class="text-white text-decoration-none hover-orange">Home</RouterLink>
          <span class="mx-2 text-white">/</span>
          <span class="text-white">Privacy Policy</span>
        </div>
      </div>
    </template>
    <template #content>
      <v-container class="py-12" fluid>
        <v-row justify="center">
          <v-col cols="12" lg="10" xl="8">
            <v-card class="pa-8 ma-4" outlined>
              <div class="privacy-policy-content">
                <h2 class="text-h4 mb-6 text-primary">Privacy Policy</h2>

                <section class="mb-6">
                  <h3 class="text-h5 mb-4 text-primary">Introduction</h3>
                  <p class="mb-4">
                    Czarles ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our employee attendance management mobile application ("App"). Please read this Privacy Policy carefully.
                  </p>
                </section>

                <section class="mb-6">
                  <h3 class="text-h5 mb-4 text-primary">Information We Collect</h3>

                  <h4 class="text-h6 mb-3 font-weight-bold">Personal Information</h4>
                  <p class="mb-3">We collect the following personal information:</p>
                  <ul class="mb-4">
                    <li><strong>Phone Number:</strong> Used for authentication and account creation</li>
                    <li><strong>Employee Information:</strong> Name, employee ID, and job-related details as provided by your employer</li>
                    <li><strong>Location Data:</strong> Real-time GPS coordinates when clocking in/out for attendance verification</li>
                    <li><strong>Images:</strong> Photos captured during attendance check-in/check-out for verification purposes</li>
                    <li><strong>Attendance Records:</strong> Clock-in/out times, overtime hours, and attendance status</li>
                  </ul>

                  <h4 class="text-h6 mb-3 font-weight-bold">Automatically Collected Information</h4>
                  <ul class="mb-4">
                    <li><strong>Device Information:</strong> Device type, operating system, and app version</li>
                    <li><strong>Usage Data:</strong> App usage patterns, features accessed, and performance metrics</li>
                    <li><strong>Location Services:</strong> GPS coordinates and location accuracy data</li>
                    <li><strong>Camera Access:</strong> Image capture capabilities for attendance verification</li>
                  </ul>

                  <h4 class="text-h6 mb-3 font-weight-bold">Technical Data</h4>
                  <ul class="mb-4">
                    <li><strong>Network Information:</strong> Internet connectivity status for offline/online synchronization</li>
                    <li><strong>Device Storage:</strong> Local storage of attendance data for offline functionality</li>
                    <li><strong>Security Data:</strong> Fake location detection and security verification information</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h5 mb-4 text-primary">How We Use Your Information</h3>
                  <p class="mb-3">We use your information for the following purposes:</p>

                  <h4 class="text-h6 mb-3 font-weight-bold">Core Functionality</h4>
                  <ul class="mb-4">
                    <li><strong>Attendance Tracking:</strong> Record and manage your work attendance</li>
                    <li><strong>Location Verification:</strong> Ensure attendance is recorded from authorized work locations</li>
                    <li><strong>Authentication:</strong> Verify your identity through phone number verification</li>
                    <li><strong>Offline Capabilities:</strong> Store attendance data locally when internet is unavailable</li>
                    <li><strong>Automatic Synchronization:</strong> Sync local data with servers when connectivity is restored</li>
                  </ul>

                  <h4 class="text-h6 mb-3 font-weight-bold">Security and Compliance</h4>
                  <ul class="mb-4">
                    <li><strong>Fraud Prevention:</strong> Detect fake locations and prevent attendance fraud</li>
                    <li><strong>Data Integrity:</strong> Ensure accuracy and reliability of attendance records</li>
                    <li><strong>Employer Compliance:</strong> Provide accurate attendance data to your employer</li>
                  </ul>

                  <h4 class="text-h6 mb-3 font-weight-bold">Service Improvement</h4>
                  <ul class="mb-4">
                    <li><strong>Performance Optimization:</strong> Improve app functionality and user experience</li>
                    <li><strong>Technical Support:</strong> Provide customer support and troubleshooting</li>
                    <li><strong>Feature Development:</strong> Develop new features based on usage patterns</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h5 mb-4 text-primary">Information Sharing and Disclosure</h3>

                  <h4 class="text-h6 mb-3 font-weight-bold">Employer Access</h4>
                  <ul class="mb-4">
                    <li>Your employer has access to attendance data, including clock-in/out times, location data, and images</li>
                    <li>Attendance records are shared with authorized personnel for payroll and HR purposes</li>
                    <li>Performance and attendance analytics may be provided to management</li>
                  </ul>

                  <h4 class="text-h6 mb-3 font-weight-bold">Third-Party Services</h4>
                  <p class="mb-3">We use the following third-party services:</p>
                  <ul class="mb-4">
                    <li><strong>Supabase:</strong> For secure data storage, authentication, and real-time synchronization</li>
                    <li><strong>Device Services:</strong> Camera and GPS services provided by your device operating system</li>
                  </ul>

                  <h4 class="text-h6 mb-3 font-weight-bold">Legal Requirements</h4>
                  <p class="mb-3">We may disclose your information when required by law or to:</p>
                  <ul class="mb-4">
                    <li>Comply with legal processes or government requests</li>
                    <li>Protect our rights, property, or safety</li>
                    <li>Prevent fraud or security threats</li>
                    <li>Enforce our terms of service</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h5 mb-4 text-primary">Data Storage and Security</h3>

                  <h4 class="text-h6 mb-3 font-weight-bold">Security Measures</h4>
                  <ul class="mb-4">
                    <li><strong>Encryption:</strong> All data is encrypted in transit and at rest</li>
                    <li><strong>Secure Authentication:</strong> Phone number-based authentication with secure tokens</li>
                    <li><strong>Access Controls:</strong> Strict access controls limit who can view your data</li>
                    <li><strong>Regular Audits:</strong> Regular security audits and vulnerability assessments</li>
                  </ul>

                  <h4 class="text-h6 mb-3 font-weight-bold">Data Storage</h4>
                  <ul class="mb-4">
                    <li><strong>Cloud Storage:</strong> Data is securely stored on Supabase servers</li>
                    <li><strong>Local Storage:</strong> Minimal data cached locally on your device for offline functionality</li>
                    <li><strong>Backup Systems:</strong> Regular backups ensure data availability and recovery</li>
                  </ul>

                  <h4 class="text-h6 mb-3 font-weight-bold">Data Retention</h4>
                  <ul class="mb-4">
                    <li><strong>Active Employment:</strong> Data retained throughout your employment period</li>
                    <li><strong>Post-Employment:</strong> Attendance records may be retained as required by law or company policy</li>
                    <li><strong>Account Deletion:</strong> You may request account deletion subject to legal and employment requirements</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h5 mb-4 text-primary">Your Rights and Choices</h3>

                  <h4 class="text-h6 mb-3 font-weight-bold">Access and Control</h4>
                  <ul class="mb-4">
                    <li><strong>Data Access:</strong> Request a copy of your personal data</li>
                    <li><strong>Data Correction:</strong> Request correction of inaccurate information</li>
                    <li><strong>Data Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
                    <li><strong>Data Portability:</strong> Request your data in a portable format</li>
                  </ul>

                  <h4 class="text-h6 mb-3 font-weight-bold">Privacy Controls</h4>
                  <ul class="mb-4">
                    <li><strong>Location Services:</strong> You can disable location services, but this may affect app functionality</li>
                    <li><strong>Camera Access:</strong> You can deny camera access, but attendance verification may be limited</li>
                    <li><strong>Notifications:</strong> Control app notifications through device settings</li>
                  </ul>

                  <h4 class="text-h6 mb-3 font-weight-bold">Opt-Out Options</h4>
                  <ul class="mb-4">
                    <li><strong>Data Processing:</strong> Contact your employer to opt-out of certain data processing activities</li>
                    <li><strong>Marketing Communications:</strong> We do not send marketing communications through this app</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h5 mb-4 text-primary">International Data Transfers</h3>
                  <p class="mb-4">
                    Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with applicable privacy laws.
                  </p>
                </section>

                <section class="mb-6">
                  <h3 class="text-h5 mb-4 text-primary">Changes to This Privacy Policy</h3>
                  <p class="mb-3">We may update this Privacy Policy from time to time. We will notify you of any material changes by:</p>
                  <ul class="mb-4">
                    <li>Posting the updated Privacy Policy in the App</li>
                    <li>Sending notification through the App</li>
                    <li>Notifying your employer of significant changes</li>
                  </ul>
                  <p class="mb-4">
                    Your continued use of the App after changes become effective constitutes acceptance of the updated Privacy Policy.
                  </p>
                </section>

                <section class="mb-6">
                  <h3 class="text-h5 mb-4 text-primary">Third-Party Links and Services</h3>
                  <p class="mb-4">
                    Our App may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.
                  </p>
                </section>

                <section class="mb-6">
                  <h3 class="text-h5 mb-4 text-primary">Data Breach Notification</h3>
                  <p class="mb-3">In the event of a data breach that may affect your personal information, we will:</p>
                  <ul class="mb-4">
                    <li>Notify affected users within 72 hours when possible</li>
                    <li>Notify relevant authorities as required by law</li>
                    <li>Provide information about the breach and steps being taken</li>
                    <li>Offer assistance and guidance to affected users</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h5 mb-4 text-primary">Contact Information</h3>
                  <p class="mb-3">
                    If you have questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us:
                  </p>
                  <div class="mb-4">
                    <p><strong>Czarles Support Team</strong></p>
                    <ul>
                      <li><strong>Email:</strong> johnelrokarl.estoque@gmail.com</li>
                      <li><strong>Phone:</strong> 09474991501</li>
                      <li><strong>Address:</strong> P - 4 Doña Flavia, San Luis, Agusan del Sur</li>
                      <li><strong>Support Hours:</strong> 8AM - 5PM Monday to Friday</li>
                    </ul>
                  </div>
                  <p class="mb-4">
                    For immediate privacy concerns, please contact your employer's HR department.
                  </p>
                </section>

                <section class="mb-6">
                  <h3 class="text-h5 mb-4 text-primary">Legal Basis for Processing (GDPR Compliance)</h3>
                  <p class="mb-3">If you are located in the European Union, our legal basis for processing your personal information includes:</p>
                  <ul class="mb-4">
                    <li><strong>Legitimate Interest:</strong> For attendance tracking and fraud prevention</li>
                    <li><strong>Contractual Necessity:</strong> To fulfill employment obligations</li>
                    <li><strong>Legal Compliance:</strong> To comply with employment and tax laws</li>
                    <li><strong>Consent:</strong> Where explicitly provided for specific processing activities</li>
                  </ul>
                </section>

                <section class="mb-6">
                  <h3 class="text-h5 mb-4 text-primary">California Privacy Rights (CCPA Compliance)</h3>
                  <p class="mb-3">If you are a California resident, you have the right to:</p>
                  <ul class="mb-4">
                    <li>Know what personal information is collected</li>
                    <li>Know whether personal information is sold or disclosed</li>
                    <li>Say no to the sale of personal information</li>
                    <li>Access your personal information</li>
                    <li>Delete your personal information (subject to exceptions)</li>
                    <li>Not be discriminated against for exercising privacy rights</li>
                  </ul>
                  <p class="mb-4">
                    We do not sell personal information to third parties.
                  </p>
                </section>

                <section class="mb-6">
                  <h3 class="text-h5 mb-4 text-primary">Compliance and Certifications</h3>
                  <p class="mb-3">This App complies with applicable privacy laws including:</p>
                  <ul class="mb-4">
                    <li>General Data Protection Regulation (GDPR)</li>
                    <li>California Consumer Privacy Act (CCPA)</li>
                    <li>Employment privacy laws</li>
                    <li>Industry-specific regulations</li>
                  </ul>
                </section>

                <v-divider class="my-6"></v-divider>

                <div class="text-center">
                  <p class="font-weight-bold mb-2">Acknowledgement</p>
                  <p class="text-body-2">
                    By using the Czarles Employee Attendance App, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.
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
