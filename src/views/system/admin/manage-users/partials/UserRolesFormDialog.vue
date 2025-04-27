<script setup lang="ts">
import {
  adminNav,
  adminItemsNav1,
  // adminItemsNav2,
  // adminItemsNav3
} from '@/components/layout/navigation/sideNavigation'
import { useUserRolesFormDialog } from './userRolesFormDialog'
import AppAlert from '@/components/common/AppAlert.vue'
import { requiredValidator } from '@/utils/validators'
import { type UserRole } from '@/stores/userRoles'
import { useDisplay } from 'vuetify'
import { ref } from 'vue'

const props = defineProps<{
  isDialogVisible: boolean
  itemData: UserRole | null
}>()

const emit = defineEmits(['update:isDialogVisible'])

const { mdAndDown } = useDisplay()

const openedPages = ref(adminNav.map((elem) => elem[0]))

const { formData, formAction, refVForm, isUpdate, onFormSubmit, onFormReset } =
  useUserRolesFormDialog(props, emit)
</script>

<template>
  <AppAlert
    v-model:is-alert-visible="formAction.formAlert"
    :form-message="formAction.formMessage"
    :form-status="formAction.formStatus"
  ></AppAlert>

  <v-dialog
    :max-width="mdAndDown ? undefined : '600'"
    :model-value="props.isDialogVisible"
    :fullscreen="mdAndDown"
    persistent
  >
    <v-card
      prepend-icon="mdi-tag"
      title="User Role"
      subtitle="Note: The Dashboard and Account Settings Page are accessible by default."
    >
      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
        <v-card-text>
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="formData.user_role"
                label="Role Name"
                :rules="[requiredValidator]"
                :disabled="isUpdate"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-list v-model:opened="openedPages" density="compact" nav>
                <v-list-group v-for="([title, icon], i) in adminNav" :key="i" :value="title">
                  <template #activator="{ props }">
                    <v-list-item v-bind="props" :prepend-icon="icon" :title="title"></v-list-item>
                  </template>

                  <template v-if="title === adminNav[0][0]">
                    <v-list-item
                      v-for="([title, icon, subtitle, to], i) in adminItemsNav1"
                      :key="i"
                      :prepend-icon="icon"
                      :title="title"
                      :subtitle="subtitle ?? undefined"
                    >
                      <template #append>
                        <v-list-item-action end>
                          <v-checkbox-btn v-model="formData.pages" :value="to"></v-checkbox-btn>
                        </v-list-item-action>
                      </template>
                    </v-list-item>
                  </template>
                </v-list-group>
              </v-list>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>

          <v-btn text="Close" variant="plain" prepend-icon="mdi-close" @click="onFormReset"></v-btn>

          <v-btn
            prepend-icon="mdi-pencil"
            color="primary"
            type="submit"
            variant="elevated"
            :disabled="formAction.formProcess"
            :loading="formAction.formProcess"
          >
            {{ isUpdate ? 'Update Role' : 'Add Role' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
