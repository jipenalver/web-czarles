<script setup lang="ts">
import { getIDNumber, getYearsOfService } from '@/utils/helpers/others'
import { type Employee } from '@/stores/employees'
import { useDisplay } from 'vuetify'
import { useDate } from 'vuetify'

const props = defineProps<{
  componentView: 'employees' | 'benefits' | 'attendance' | 'payroll'
  columnsLength: number
  itemData: Employee
}>()

const date = useDate()
const { mobile } = useDisplay()
</script>

<template>
  <tr>
    <td :colspan="props.columnsLength" class="py-2">
      <v-row dense>
        <v-col
          cols="12"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">ID No.:</span>
          <v-chip class="font-weight-black" color="default" size="small">
            {{ getIDNumber(props.itemData.hired_at, props.itemData.id) }}
          </v-chip>
        </v-col>

        <v-col
          cols="12"
          sm="6"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <p class="text-body-2 font-weight-bold me-2">Birthdate:</p>
          <p class="text-body-2">{{ date.format(props.itemData.birthdate, 'fullDate') }}</p>
        </v-col>

        <v-col
          cols="12"
          sm="6"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <p class="text-body-2 font-weight-bold me-2">Address:</p>
          <p class="text-body-2">{{ props.itemData.address }}</p>
        </v-col>

        <v-col
          cols="12"
          sm="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Years of Service:</span>
          <v-chip class="font-weight-black" color="default" size="small">
            {{ getYearsOfService(props.itemData.hired_at) }}
          </v-chip>
        </v-col>

        <v-col
          cols="12"
          sm="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Contract Status:</span>
          <p class="text-body-2">{{ props.itemData.is_permanent ? 'Permanent' : 'Contractual' }}</p>
        </v-col>

        <v-col
          cols="12"
          sm="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Is Field Staff?:</span>
          <p class="text-body-2">{{ props.itemData.is_field_staff ? 'Yes' : 'No' }}</p>
        </v-col>

        <v-col
          cols="12"
          sm="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">With Accident Insurance:</span>
          <p class="text-body-2">{{ props.itemData.is_insured ? 'Yes' : 'No' }}</p>
        </v-col>

        <v-col
          cols="12"
          sm="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">TIN No.:</span>
          <p class="text-body-2">{{ props.itemData.tin_no }}</p>
        </v-col>

        <v-col
          cols="12"
          sm="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">SSS No.:</span>
          <p class="text-body-2">{{ props.itemData.sss_no }}</p>
        </v-col>

        <v-col
          cols="12"
          sm="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Philhealth No.:</span>
          <p class="text-body-2">{{ props.itemData.philhealth_no }}</p>
        </v-col>

        <v-col
          cols="12"
          sm="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Pag-ibig No.:</span>
          <p class="text-body-2">{{ props.itemData.philhealth_no }}</p>
        </v-col>

        <v-col
          cols="12"
          sm="6"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Area of Origin:</span>
          <p class="text-body-2">
            {{ props.itemData.area_origin ? props.itemData.area_origin.area : 'n/a' }}
          </p>
        </v-col>

        <v-col
          cols="12"
          sm="6"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Area of Assignment:</span>
          <p class="text-body-2">
            {{ props.itemData.area_assignment ? props.itemData.area_assignment.area : 'n/a' }}
          </p>
        </v-col>

        <template v-if="props.componentView === 'benefits'"> </template>
      </v-row>

      <v-divider class="my-3" thickness="1"></v-divider>
    </td>
  </tr>
</template>
