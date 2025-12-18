<script setup lang="ts">
import { lengthMinValidator, requiredValidator } from '@/utils/validators'
import AppAlert from '@/components/common/AppAlert.vue'
import { useProfileForm } from './profileForm'

const { formData, formAction, refVForm, onFormSubmit } = useProfileForm()
</script>

<template>
  <AppAlert
    v-model:is-alert-visible="formAction.formAlert"
    :form-message="formAction.formMessage"
    :form-status="formAction.formStatus"
  ></AppAlert>

  <v-form ref="refVForm" @submit.prevent="onFormSubmit">
    <v-row dense>
      <v-col cols="12" sm="4">
        <v-text-field
          v-model="formData.firstname"
          label="Firstname"
          :rules="[requiredValidator]"
        ></v-text-field>
      </v-col>

      <v-col cols="12" sm="4">
        <v-text-field v-model="formData.middlename" label="Middlename"></v-text-field>
      </v-col>

      <v-col cols="12" sm="4">
        <v-text-field
          v-model="formData.lastname"
          label="Lastname"
          :rules="[requiredValidator]"
        ></v-text-field>
      </v-col>

      <v-col cols="12" sm="6">
        <v-text-field
          v-model="formData.email"
          label="Email"
          prepend-inner-icon="mdi-email-outline"
          disabled
        ></v-text-field>
      </v-col>

      <v-col cols="12" sm="6">
        <v-text-field
          v-model="formData.phone"
          label="Phone Number"
          prepend-inner-icon="mdi-phone"
          :rules="[requiredValidator, lengthMinValidator(formData.phone as string, 11)]"
        ></v-text-field>
      </v-col>
    </v-row>

    <v-btn
      class="mt-2"
      type="submit"
      prepend-icon="mdi-account-box-edit-outline"
      color="primary"
      variant="elevated"
      rounded="lg"
      :disabled="formAction.formProcess"
      :loading="formAction.formProcess"
    >
      Update Information
    </v-btn>
  </v-form>
</template>
