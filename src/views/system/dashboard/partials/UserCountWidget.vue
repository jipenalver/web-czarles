<script setup lang="ts">
import { useUsersStore } from '@/stores/users'
import { onMounted } from 'vue'

const usersStore = useUsersStore()

onMounted(async () => {
  if (usersStore.usersTable.length === 0)
    await usersStore.getUsersTable({ page: 1, itemsPerPage: 10, sortBy: [] })
})
</script>

<template>
  <v-card elevation="8">
    <template #prepend>
      <v-chip color="secondary">
        <v-icon icon="mdi-account-multiple"></v-icon>
      </v-chip>
    </template>

    <v-card-text class="text-center">
      <h2 class="text-h3">{{ usersStore.usersTableTotal }}</h2>
      <p class="mb-3">Total Users</p>

      <v-chip class="font-weight-bold" density="compact" color="secondary"> System Wide </v-chip>
    </v-card-text>
  </v-card>
</template>
