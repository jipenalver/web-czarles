<script setup lang="ts">
import { formActionDefault } from '@/utils/helpers/constants'
// import { handleFormError } from '@/utils/helpers/forms'
import AppAlert from '@/components/common/AppAlert.vue'
import { getAvatarText } from '@/utils/helpers/others'
// import { useAuthUserStore } from '@/stores/authUser'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
// import axios from 'axios'

const router = useRouter()

const authUserStore = useAuthUserStore()

const formAction = ref({ ...formActionDefault })

const onLogout = async () => {
  formAction.value = { ...formActionDefault, formProcess: true }

  // try {
  //   await axios.post('/api/v1/auth/logout')

  //   authUserStore.removeAuthData()
  //   dreamsStore.$reset()
  //   groupsStore.$reset()
  //   router.replace('/')
  // } catch (error) {
  //   const { message, status } = handleFormError(error)
  //   formAction.value = {
  //     ...formActionDefault,
  //     formMessage: message,
  //     formStatus: status,
  //   }
  // } finally {
  //   formAction.value.formProcess = false
  // }
}
</script>

<template>
  <AppAlert
    v-model:is-alert-visible="formAction.formAlert"
    :form-message="formAction.formMessage"
    :form-status="formAction.formStatus"
  ></AppAlert>

  <v-menu min-width="200px" rounded>
    <template #activator="{ props }">
      <v-btn icon v-bind="props">
        <v-avatar
          v-if="authUserStore.userData?.avatar"
          :image="authUserStore.userData.avatar"
          color="primary"
          size="large"
        >
        </v-avatar>

        <v-avatar v-else color="primary" size="large">
          <span class="text-h5">
            {{
              getAvatarText(
                authUserStore.userData?.firstname + ' ' + authUserStore.userData?.lastname,
              )
            }}
          </span>
        </v-avatar>
      </v-btn>
    </template>

    <v-card class="mt-1">
      <v-card-text>
        <v-list>
          <v-list-item
            :subtitle="authUserStore.userData?.email"
            :title="authUserStore.userData?.firstname + ' ' + authUserStore.userData?.lastname"
          >
            <template #prepend>
              <v-avatar
                v-if="authUserStore.userData?.avatar"
                :image="appStorageUrl + authUserStore.userData.avatar"
                color="primary"
                size="large"
              >
              </v-avatar>

              <v-avatar v-else color="primary" size="large">
                <span class="text-h5">
                  {{
                    getAvatarText(
                      authUserStore.userData?.firstname + ' ' + authUserStore.userData?.lastname,
                    )
                  }}
                </span>
              </v-avatar>
            </template>
          </v-list-item>
        </v-list>

        <template v-if="authUserStore.userData?.email_verified_at">
          <v-divider class="my-3"></v-divider>

          <v-btn prepend-icon="mdi-wrench" variant="plain" to="/settings/account"> Settings </v-btn>
        </template>

        <v-divider class="my-3"></v-divider>

        <v-btn
          prepend-icon="mdi-logout"
          variant="plain"
          @click="onLogout"
          :loading="formAction.formProcess"
          :disabled="formAction.formProcess"
        >
          Logout
        </v-btn>
      </v-card-text>
    </v-card>
  </v-menu>
</template>
