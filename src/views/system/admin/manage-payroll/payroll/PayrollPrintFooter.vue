<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ dateString?: string }>()

const effectiveDate = computed(() => {
  // Prefer explicit prop, fallback to localStorage key set by PayrollTableDialog
  const source = props.dateString ?? (typeof window !== 'undefined' ? localStorage.getItem('czarles_payroll_dateString') : null)
  if (!source) return '—'
  // source may be 'YYYY-MM' or 'YYYY-MM-DD'
  const ds = source.length === 7 ? `${source}-01` : source
  const d = new Date(ds)
  if (isNaN(d.getTime())) return source
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
})
</script>

<template>
  <v-row dense no-gutters>
    <v-col cols="4" sm="3" class="d-flex justify-start align-center">
      <v-table class="mt-3 text-caption border pa-1 compact-table" density="compact">
        <div>
          <div class="d-flex align-center justify-space-between pa-0 ma-0">
            <div class="pa-1">Form No :</div>

            <div class="pa-1">FM-PRO-CCS-PAY-06</div>
          </div>
          <div class="d-flex align-center justify-space-between pa-0 ma-0">
            <div class="pa-1">Issue Status :</div>

            <div class="pa-1">02</div>
          </div>
          <div class="d-flex align-center justify-space-between pa-0 ma-0">
            <div class="pa-1">Revision No :</div>

            <div class="pa-1">00</div>
          </div>
          <div class="d-flex align-center justify-space-between pa-0 ma-0">
            <div class="pa-1">Date Effective :</div>

            <div class="pa-1">{{ effectiveDate }}</div>
          </div>
          <div class="d-flex align-center justify-space-between pa-0 ma-0">
            <div class="pa-1">Approve By:</div>

            <div class="pa-1">Proprietor / General Manager</div>
          </div>
        </div>
      </v-table>
    </v-col>
    <v-col cols="8" sm="9" class="d-flex justify-start align-start">asd</v-col>
  </v-row>
</template>

<style>
.compact-table {
  line-height: 0.8 !important;
  font-size: 0.75rem;
  border-collapse: collapse;
}
</style>
