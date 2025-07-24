<script setup lang="ts">
import { useDisplay } from 'vuetify'
import { type Trip } from '@/stores/trips' // Assume Trip type exists
import { useDate } from 'vuetify'

const props = defineProps<{
  columnsLength: number
  itemData: Trip
}>()

const { mobile } = useDisplay()
const date = useDate()
</script>

<template>
  <tr>
    <td :colspan="props.columnsLength" class="py-2">
      <v-row :class="mobile ? '' : 'px-4'" :no-gutters="!mobile" dense>
        <v-col
          cols="12"
          sm="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Trip No.:</span>
          <v-chip class="font-weight-black" color="primary" size="small">
            {{ props.itemData.trip_no || 'N/A' }}
          </v-chip>
        </v-col>

        <v-col
          cols="12"
          sm="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Date:</span>
          <span class="text-body-2 font-weight-bold">
            {{ props.itemData.date ? date.format(props.itemData.date, 'keyboardDate') : 'N/A' }}
          </span>
        </v-col>

        <v-col
          cols="12"
          sm="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Employee:</span>
          <span class="text-body-2">{{ props.itemData.employee_id || 'N/A' }}</span>
        </v-col>

        <v-col
          cols="12"
          sm="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Unit:</span>
          <span class="text-body-2">{{ props.itemData.units?.name || 'N/A' }}</span>
        </v-col>

        <v-col
          cols="12"
          sm="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Location:</span>
          <span class="text-body-2">{{ props.itemData.trip_location?.location || 'N/A' }}</span>
        </v-col>

        <v-col
          cols="12"
          sm="6"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Description:</span>
          <span class="text-body-2">{{ props.itemData.description || 'N/A' }}</span>
        </v-col>

        <v-col
          cols="12"
          sm="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">KM:</span>
          <span class="text-body-2">{{ props.itemData.km || 'N/A' }}</span>
        </v-col>

        <v-col
          cols="12"
          sm="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Per Trip:</span>
          <span class="text-body-2">{{ props.itemData.per_trip ? `₱${props.itemData.per_trip}` : 'N/A' }}</span>
        </v-col>

        <v-col
          cols="12"
          sm="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Materials:</span>
          <span class="text-body-2">{{ props.itemData.materials || 'N/A' }}</span>
        </v-col>

        <v-col
          cols="12"
          sm="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Created Date:</span>
          <span class="text-body-2 font-weight-bold">{{ date.format(props.itemData.created_at, 'fullDateTime') }}</span>
        </v-col>

        <v-divider class="my-3" thickness="1"></v-divider>
      </v-row>
    </td>
  </tr>
</template>
