<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { getMoneyText } from '@/utils/helpers/others'

const props = defineProps<{ dateString?: string; price?: string | number }>()

// reactive price that listens to realtime updates
const livePrice = ref<string | number | null>(props.price ?? null)

const onPriceUpdate = (ev: Event) => {
  try {
    // CustomEvent detail with { price }
    const detail = (ev as CustomEvent)?.detail
    if (detail && typeof detail.price !== 'undefined') livePrice.value = detail.price
  } catch {
    // ignore
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    // prefer explicit prop, fallback to localStorage key set by PayrollTableDialog
  const stored = localStorage.getItem('czarles_payroll_price')
  if (livePrice.value === null && stored !== null) livePrice.value = stored
    window.addEventListener('czarles_payroll_price_update', onPriceUpdate as EventListener)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('czarles_payroll_price_update', onPriceUpdate as EventListener)
  }
})

const formattedPrice = computed(() => {
  const val = livePrice.value ?? props.price
  if (val === null || typeof val === 'undefined' || val === '') return '—'
  try {
    return getMoneyText(val as string | number)
  } catch {
    return String(val)
  }
})

const effectiveDate = computed(() => {
  // Prefer explicit prop, fallback to localStorage key set by PayrollTableDialog
  try {
    // Prefer an explicit from/to range saved in localStorage
    if (typeof window !== 'undefined') {
      const from = localStorage.getItem('czarles_payroll_fromDate')
      const to = localStorage.getItem('czarles_payroll_toDate')
      if (from && to) {
        const start = new Date(from)
        const end = new Date(to)
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          return `${start.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })} - ${end.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })}`
        }
      }
    }

    const source =
      props.dateString ??
      (typeof window !== 'undefined' ? localStorage.getItem('czarles_payroll_dateString') : null)
    if (!source) return '—'
    // source may be 'YYYY-MM' or 'YYYY-MM-DD'
    const ds = source.length === 7 ? `${source}-01` : source
    const d = new Date(ds)
    if (isNaN(d.getTime())) return source
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
  } catch {
    return '—'
  }
})
</script>

<template>
  <v-row dense no-gutters>
    <v-col cols="4" sm="3" class="d-flex justify-start align-center">
      <v-table class="mt-3 text-caption thick-border pa-1 compact-table" density="compact">
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
    <v-col cols="8" sm="9" class="d-flex justify-start align-start text-caption"
      ><v-row>
        <v-col cols="10">
          RECEIVED from C'ZARLES CONSTRUCTION & SUPPLY the amount of PESOS:
        </v-col>
        <v-col cols="2" class="text-end">
          {{ formattedPrice }}
        </v-col>
        <v-divider class="mx-4"></v-divider>
        <v-col cols="12" >
          <div class="text-start">in full payment of the amount described above.</div>
        </v-col>
        <v-row class="mx-5">
          <v-col cols="4">
            <div class="text-center" style="text-decoration:underline">NINA MIKAELAA ABANERO</div>
            <div class="mx-10 text-center">Prepared By</div>
          </v-col>
          <v-col cols="4">
            <div class="text-center" style="text-decoration:underline">CESAR T. PALMA JR.</div>
             <div class="mx-10 text-center">Approved</div>
          </v-col>
           <v-col cols="4">
            <div class="text-start">BY: ________________________</div>
             <div>Signature Over Printed Name</div>
          </v-col>
        </v-row>
      </v-row>
    </v-col>
 
  </v-row>
</template>

<style>
.compact-table {
  line-height: 0.8 !important;
  font-size: 0.30rem;
  border-collapse: collapse;
}

/* default when not printing */
.thick-border {
  border: 1px solid;
}

@media print {
  .thick-border {
    border: 1px solid !important;
  }
}

/* Programmatic hook: add .pdf-print-active to a parent during html2pdf run */
.pdf-print-active .thick-border {
  border: 1px solid !important;
}
</style>