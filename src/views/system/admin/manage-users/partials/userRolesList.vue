<script setup lang="ts">
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
// import UserRolesFormDialog from './UserRolesFormDialog.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import { useUserRolesList } from './userRolesList'

const {
  itemData,
  formAction,
  isDialogVisible,
  isConfirmDeleteDialog,
  onAdd,
  onUpdate,
  onDelete,
  onConfirmDelete,
  userRolesStore,
} = useUserRolesList()
</script>

<template>
  <AppAlert
    v-model:is-alert-visible="formAction.formAlert"
    :form-message="formAction.formMessage"
    :form-status="formAction.formStatus"
  ></AppAlert>

  <v-row>
    <v-col cols="12" sm="4" v-for="item in userRolesStore.userRolesList" :key="item.id">
      <v-card>
        <v-card-title class="mt-3 font-weight-bold"> {{ item.role }} </v-card-title>

        <v-card-text class="d-flex align-center justify-space-between">
          <h3>{{ item.users_count }} User(s)</h3>

          <div class="d-flex flex-wrap ga-2">
            <v-btn variant="text" density="comfortable" @click="onUpdate(item)" icon>
              <v-icon icon="mdi-tag-edit"></v-icon>
              <v-tooltip activator="parent" location="top">Edit Role</v-tooltip>
            </v-btn>
            <v-btn
              variant="text"
              density="comfortable"
              @click="onDelete(item.id)"
              :disabled="item.users_count > 0"
              icon
            >
              <v-icon icon="mdi-tag-remove" color="error"> </v-icon>
              <v-tooltip activator="parent" location="top">Delete Role</v-tooltip>
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="4">
      <v-card>
        <v-card-title class="mt-3 d-flex justify-end">
          <v-btn prepend-icon="mdi-tag-plus" color="primary" @click="onAdd"> Add Role </v-btn>
        </v-card-title>
        <v-card-text class="mt-2 mb-1 text-end"> Add Role if it doesn't exist. </v-card-text>
      </v-card>
    </v-col>
  </v-row>
  <!--
  <UserRolesFormDialog
    v-model:is-dialog-visible="isDialogVisible"
    :item-data="itemData"
  ></UserRolesFormDialog> -->

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmDeleteDialog"
    title="Confirm Delete"
    text="Are you sure you want to delete user role?"
    @confirm="onConfirmDelete"
  ></ConfirmDialog>
</template>
