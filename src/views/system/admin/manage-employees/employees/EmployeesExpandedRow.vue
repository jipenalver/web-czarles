<script setup lang="ts">
import { getIDNumber, getMoneyText } from '@/utils/helpers/others'
import { getYearsOfService } from '@/utils/helpers/dates'
import { type Employee } from '@/stores/employees'
import { useDisplay } from 'vuetify'
import { useDate } from 'vuetify'

const props = defineProps<{
  componentView: 'employees' | 'benefits' | 'payroll'
  columnsLength: number
  itemData: Employee
}>()

const date = useDate()
const { mobile } = useDisplay()
</script>

<template>
  <tr>
    <td :colspan="props.columnsLength" class="py-2">
      <v-row :class="mobile ? '' : 'px-4'" :no-gutters="!mobile" dense>
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
          md="6"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Birthdate:</span>
          <p class="text-body-2">{{ date.format(props.itemData.birthdate, 'fullDate') }}</p>
        </v-col>

        <v-col
          cols="12"
          md="6"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Address:</span>
          <p class="text-body-2">{{ props.itemData.address }}</p>
        </v-col>

        <v-col
          cols="12"
          md="3"
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
          md="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Contract Status:</span>
          <p class="text-body-2">{{ props.itemData.is_permanent ? 'Permanent' : 'Contractual' }}</p>
        </v-col>

        <v-col
          cols="12"
          md="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Field or Office:</span>
          <v-chip class="font-weight-black" color="default" size="small">
            {{ props.itemData.is_field_staff ? 'Field Staff' : 'Office Staff' }}
          </v-chip>
        </v-col>

        <v-col
          cols="12"
          md="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">GPS Enabled / Disabled:</span>
          <v-chip
            class="font-weight-black"
            :color="props.itemData.is_gps_disabled ? 'error' : 'success'"
            size="small"
          >
            {{ props.itemData.is_gps_disabled ? 'Disabled' : 'Enabled' }}
          </v-chip>
        </v-col>

        <v-col
          cols="12"
          md="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">TIN No.:</span>
          <p class="text-body-2">{{ props.itemData.tin_no }}</p>
        </v-col>

        <v-col
          cols="12"
          md="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">SSS No.:</span>
          <p class="text-body-2">{{ props.itemData.sss_no }}</p>
        </v-col>

        <v-col
          cols="12"
          md="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Philhealth No.:</span>
          <p class="text-body-2">{{ props.itemData.philhealth_no }}</p>
        </v-col>

        <v-col
          cols="12"
          md="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Pag-ibig No.:</span>
          <p class="text-body-2">{{ props.itemData.philhealth_no }}</p>
        </v-col>

        <v-col
          cols="12"
          md="6"
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
          md="6"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Area of Assignment:</span>
          <p class="text-body-2">
            {{ props.itemData.area_assignment ? props.itemData.area_assignment.area : 'n/a' }}
          </p>
        </v-col>

        <template v-if="props.componentView === 'benefits' || props.componentView === 'payroll'">
          <v-divider class="my-3" thickness="1"></v-divider>

          <v-col
            cols="12"
            md="6"
            class="d-flex align-center my-2"
            :class="mobile ? 'justify-space-between' : 'justify-start'"
          >
            <span class="text-body-2 font-weight-bold me-2">Daily Rate:</span>
            <v-chip class="font-weight-black" color="default" size="small">
              {{ props.itemData.daily_rate ? getMoneyText(props.itemData.daily_rate) : 'n/a' }}
            </v-chip>
          </v-col>

          <v-col
            cols="12"
            md="6"
            class="d-flex align-center my-2"
            :class="mobile ? 'justify-space-between' : 'justify-start'"
          >
            <span class="text-body-2 font-weight-bold me-2">With Accident Insurance:</span>
            <p class="text-body-2">{{ props.itemData.is_insured ? 'Yes' : 'No' }}</p>
          </v-col>

          <template v-if="props.itemData.employee_deductions.length > 0">
            <v-divider class="my-3" thickness="1"></v-divider>

            <v-col
              v-for="benefit in props.itemData.employee_deductions"
              :key="benefit.benefit_id"
              cols="12"
              md="4"
              class="d-flex align-center my-2"
              :class="mobile ? 'justify-space-between' : 'justify-start'"
            >
              <span class="text-body-2 font-weight-bold me-2">
                {{ benefit.benefit.benefit }}:
              </span>
              <p class="text-body-2">{{ getMoneyText(benefit.amount as number) }}</p>
            </v-col>
          </template>
        </template>

        <v-divider class="my-3" thickness="1"></v-divider>
      </v-row>
    </td>
  </tr>
</template>
