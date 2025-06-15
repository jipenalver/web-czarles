<script setup lang="ts">
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { type TableHeader } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import UsersFormDialog from './UsersFormDialog.vue'
import { useUsersTable } from './usersTable'
import { useDisplay } from 'vuetify'
import { useDate } from 'vuetify'

const date = useDate()
const { mobile } = useDisplay()

const tableHeaders: TableHeader[] = [
  {
    title: 'Email',
    key: 'email',
    sortable: false,
    align: 'start',
  },
  {
    title: 'Fullname',
    key: 'lastname',
    sortable: false,
    align: 'start',
  },
  {
    title: 'Phone',
    key: 'phone',
    sortable: false,
    align: 'start',
  },
  {
    title: 'Role',
    key: 'user_role',
    sortable: false,
    align: 'start',
  },
  {
    title: 'Registered Date',
    key: 'created_at',
    sortable: false,
    align: 'center',
  },
  {
    title: 'Actions',
    key: 'actions',
    sortable: false,
    align: 'center',
  },
]

const {
  tableOptions,
  isDialogVisible,
  isConfirmDeleteDialog,
  itemData,
  formAction,
  onAdd,
  onUpdate,
  onDelete,
  onConfirmDelete,
  onLoadItems,
  usersStore,
  authUserStore,
} = useUsersTable()
</script>

<template>
  <AppAlert
    v-model:is-alert-visible="formAction.formAlert"
    :form-message="formAction.formMessage"
    :form-status="formAction.formStatus"
  ></AppAlert>

  <v-card>
    <v-card-text>
      <!-- eslint-disable vue/valid-v-slot -->
      <v-data-table-server
        v-model:items-per-page="tableOptions.itemsPerPage"
        v-model:page="tableOptions.page"
        v-model:sort-by="tableOptions.sortBy"
        :loading="tableOptions.isLoading"
        :headers="tableHeaders"
        :items="usersStore.usersTable"
        :items-length="usersStore.usersTableTotal"
        @update:options="onLoadItems"
        :hide-default-header="mobile"
        :mobile="mobile"
      >
        <template #top>
          <v-row dense>
            <v-spacer></v-spacer>

            <v-col cols="12" sm="3">
              <v-btn
                class="my-1"
                prepend-icon="mdi-account-plus"
                color="primary"
                block
                @click="onAdd"
              >
                Add User
              </v-btn>
            </v-col>
          </v-row>

          <v-divider class="my-5"></v-divider>
        </template>

        <template #item.lastname="{ item }">
          <span class="font-weight-bold"> {{ item.lastname }}, {{ item.firstname }} </span>
        </template>

        <template #item.user_role="{ item }">
          <v-chip
            v-if="item.user_role"
            class="font-weight-bold"
            color="secondary"
            variant="flat"
            size="small"
          >
            {{ item.user_role }}
          </v-chip>
        </template>

        <template #item.created_at="{ item }">
          <span class="font-weight-bold">
            {{ date.format(item.created_at, 'fullDateTime') }}
          </span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center" :class="mobile ? 'justify-end' : 'justify-center'">
            <v-btn
              variant="text"
              density="comfortable"
              :disabled="item.is_admin || authUserStore.userData?.id === item.id"
              @click="onUpdate(item)"
              icon
            >
              <v-icon icon="mdi-pencil"></v-icon>
              <v-tooltip activator="parent" location="top">Edit User</v-tooltip>
            </v-btn>

            <v-btn
              variant="text"
              density="comfortable"
              :disabled="item.is_admin || authUserStore.userData?.id === item.id"
              @click="onDelete(item.id)"
              icon
            >
              <v-icon icon="mdi-trash-can" color="secondary"></v-icon>
              <v-tooltip activator="parent" location="top">Delete User</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>

  <UsersFormDialog
    v-model:is-dialog-visible="isDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
  ></UsersFormDialog>

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmDeleteDialog"
    title="Confirm Delete"
    text="Are you sure you want to delete user?"
    @confirm="onConfirmDelete"
  ></ConfirmDialog>
</template>
