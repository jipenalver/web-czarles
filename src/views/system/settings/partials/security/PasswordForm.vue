<script setup lang="ts">
import { confirmedValidator, passwordValidator, requiredValidator } from '@/utils/validators'
import AppAlert from '@/components/common/AppAlert.vue'
import { usePasswordForm } from './passwordForm'
import { ref } from 'vue'

const isPasswordVisible = ref(false)
const isPasswordConfirmVisible = ref(false)

const { formData, formAction, refVForm, onFormSubmit } = usePasswordForm()
</script>

<template>
  <AppAlert
    v-model:is-alert-visible="formAction.formAlert"
    :form-message="formAction.formMessage"
    :form-status="formAction.formStatus"
  ></AppAlert>

  <v-form ref="refVForm" @submit.prevent="onFormSubmit">
    <v-row dense>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="formData.password"
          prepend-inner-icon="mdi-lock-outline"
          label="New Password"
          :type="isPasswordVisible ? 'text' : 'password'"
          :append-inner-icon="isPasswordVisible ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="isPasswordVisible = !isPasswordVisible"
          :rules="[requiredValidator, passwordValidator]"
        ></v-text-field>
      </v-col>

      <v-col cols="12" sm="6">
        <v-text-field
          v-model="formData.password_confirmation"
          label="Password Confirmation"
          :type="isPasswordConfirmVisible ? 'text' : 'password'"
          :append-inner-icon="isPasswordConfirmVisible ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="isPasswordConfirmVisible = !isPasswordConfirmVisible"
          :rules="[
            requiredValidator,
            confirmedValidator(formData.password_confirmation, formData.password),
          ]"
        ></v-text-field>
      </v-col>

      <v-col cols="12">
        <p class="font-weight-bold mt-2">Password Requirements:</p>
        <ul class="list-disc ps-4 mb-2">
          <li>At least one lowercase character</li>
          <li>At least one uppercase character</li>
          <li>At least one number</li>
          <li>At least one special character</li>
          <li>Minimum 8 characters long - the more, the better</li>
        </ul>
      </v-col>
    </v-row>

    <v-btn
      class="mt-2"
      type="submit"
      prepend-icon="mdi-key"
      color="primary"
      variant="elevated"
      rounded="lg"
      :disabled="formAction.formProcess"
      :loading="formAction.formProcess"
    >
      Change Password
    </v-btn>
  </v-form>
</template>
