<script setup lang="ts">
import { imageValidator, requiredValidator } from '@/utils/validators'
import AppAlert from '@/components/common/AppAlert.vue'
import { usePictureForm } from './pictureForm'

const { formAction, refVForm, imgPreview, onPreview, onPreviewReset, onFormSubmit } =
  usePictureForm()
</script>

<template>
  <AppAlert
    v-model:is-alert-visible="formAction.formAlert"
    :form-message="formAction.formMessage"
    :form-status="formAction.formStatus"
  ></AppAlert>

  <v-form ref="refVForm" @submit.prevent="onFormSubmit">
    <v-row>
      <v-col cols="12" xl="4" lg="5" sm="5">
        <v-img
          width="55%"
          class="mx-auto rounded-circle"
          color="primary"
          aspect-ratio="1"
          :src="imgPreview"
          alt="Profile Picture Preview"
          cover
        >
        </v-img>
      </v-col>

      <v-col cols="12" xl="8" lg="7" sm="7">
        <v-file-input
          class="mt-5 mb-3"
          prepend-icon="mdi-camera"
          accept="image/png, image/jpeg"
          label="Browse Profile Picture"
          placeholder="Browse Profile Picture"
          hint="Allowed JPG or PNG. Max size of 2MB."
          :rules="[requiredValidator, imageValidator]"
          persistent-hint
          show-size
          chips
          @change="onPreview"
          @click:clear="onPreviewReset"
        ></v-file-input>

        <v-btn
          class="mt-2"
          type="submit"
          prepend-icon="mdi-image-edit"
          color="primary"
          variant="elevated"
          rounded="lg"
          :disabled="formAction.formProcess"
          :loading="formAction.formProcess"
        >
          Update Picture
        </v-btn>
      </v-col>
    </v-row>
  </v-form>
</template>
