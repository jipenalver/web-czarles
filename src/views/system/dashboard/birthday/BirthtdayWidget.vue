<script setup lang="ts">
import { useEmployeesStore, type EmployeeTableFilter } from '@/stores/employees'
import { loadEmployees, getAge, getAvatar, isToday, getZodiacSign, getDaysUntilBirthday, getAgeMilestone, getBirthdayEmoji } from './birthdayWidget'
import { type TableHeader } from '@/utils/helpers/tables'
import { ref, computed, onMounted, watch } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useDate } from 'vuetify'

const employeesStore = useEmployeesStore()
const usersStore = useUsersStore()
const date = useDate()

// slot names (use variables to avoid parser issues with bracketed string literals)
const slotItemLastname = 'item.lastname'
const slotItemBirthdate = 'item.birthdate'
const slotItemAge = 'item.age'

const tableOptions = ref({ page: 1, itemsPerPage: 1000, sortBy: [], isLoading: false })
const tableFilters = ref<EmployeeTableFilter>({ search: '', designation_id: null })

const tableHeaders: TableHeader[] = [
  { title: 'Celebrant', key: 'lastname', align: 'start' },
  { title: 'Birthday Details', key: 'birthdate', align: 'start' },
  { title: 'Age & Fun Facts', key: 'age', align: 'center' },
]

// Load employees export which we will filter locally for birthdays
onMounted(async () => {
  if (employeesStore.employeesExport.length === 0)
    await loadEmployees(employeesStore, tableOptions, tableFilters, usersStore)
})

watch(
  () => tableFilters.value.search,
  async () => {
    // refresh export when searching
    await loadEmployees(employeesStore, tableOptions, tableFilters, usersStore)
  },
)

const currentMonth = new Date().getMonth()

const birthdays = computed(() => {
  return employeesStore.employeesExport
    .filter((e) => e.birthdate)
    .filter((e) => new Date(e.birthdate).getMonth() === currentMonth)
    .sort((a, b) => new Date(a.birthdate).getDate() - new Date(b.birthdate).getDate())
})

const todaysBirthdays = computed(() => {
  return birthdays.value.filter(emp => isToday(emp))
})


</script>

<template>
  <v-card class="birthday-widget elevation-8" color="gradient-primary">
    <v-card-title class="pa-6 pb-2">
      <div class="d-flex align-center">
        <v-icon size="32" color="warning" class="me-3 animate-bounce">mdi-cake-variant</v-icon>
        <span class="text-h5 font-weight-bold">🎉 Birthday Central 🎂</span>
      </div>
      <div class="text-caption mt-1">
        Celebrating amazing people this month!
      </div>
    </v-card-title>

    <!-- Today's Birthday Special Section -->
    <div v-if="todaysBirthdays.length > 0" class="pa-4">
      <v-alert 
        color="pink" 
        variant="elevated" 
        class="birthday-alert animate-pulse mb-4"
        prominent
        border
      >
        <template #prepend>
          <v-icon size="40" class="animate-spin-slow">mdi-party-popper</v-icon>
        </template>
        <div class="text-h6 font-weight-bold mb-2">🎊 TODAY'S BIRTHDAY STARS! 🎊</div>
        <div v-for="person in todaysBirthdays" :key="person.id" class="mb-2">
          <div class="d-flex align-center">
            <v-avatar size="56" class="me-3 birthday-avatar">
              <v-img :src="getAvatar(person, usersStore.users)" alt="Birthday person"></v-img>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">
                🎈 {{ person.firstname }} {{ person.lastname }} 🎈
              </div>
              <div class="text-body-2">
                Turning {{ getAge(person.birthdate) }} today! {{ getBirthdayEmoji(getAge(person.birthdate)) }}
              </div>
              <div class="text-caption">
                {{ getZodiacSign(person.birthdate) }} • {{ getAgeMilestone(getAge(person.birthdate)) }}
              </div>
              <div>
                Serving since <strong>{{ person.serving_since ?? (person.hired_at ? new Date(person.hired_at).getFullYear() : '') }}</strong>
                <span v-if="person.years_served !== undefined"> • {{ person.years_served }} year{{ person.years_served === 1 ? '' : 's' }}</span>
              </div>
            </div>
          </div>
        </div>
      </v-alert>
    </div>

    <v-card-text class="pa-4">
      <!-- Birthday Calendar Table -->
      <v-card class="mb-4" elevation="4">
        <v-card-title class="bg-purple-lighten-4 text-purple-darken-3">
          <v-icon class="me-2">mdi-calendar-heart</v-icon>
          This Month's Birthday Calendar
        </v-card-title>
        
        <v-data-table-server
          v-model:items-per-page="tableOptions.itemsPerPage"
          v-model:page="tableOptions.page"
          v-model:sort-by="tableOptions.sortBy"
          :loading="tableOptions.isLoading"
          :headers="tableHeaders"
          :items="birthdays"
          :items-length="birthdays.length"
          :hide-default-header="false"
          class="birthday-table"
        >
          <template v-slot:[slotItemLastname]="{ item }">
            <div :class="['d-flex align-center pa-2', isToday(item) ? 'birthday-today' : '']">
              <v-avatar
                :size="isToday(item) ? 56 : 44"
                :class="['me-3', isToday(item) ? 'birthday-avatar animate-bounce' : '']"
                :image="getAvatar(item, usersStore.users)"
                color="primary"
              >
              </v-avatar>
              <div>
                <div :class="['font-weight-bold', isToday(item) ? 'text-pink text-h6' : 'text-body-1']">
                  {{ item.lastname }}, {{ item.firstname }}
                  <span v-if="isToday(item)" class="animate-bounce">🎂</span>
                </div>
                <div v-if="!isToday(item)" class="text-caption text-grey">
                  {{ getDaysUntilBirthday(item.birthdate) }} days to go!
                </div>
              </div>
              <v-chip 
                v-if="isToday(item)" 
                color="pink" 
                variant="elevated"
                class="ms-2 animate-pulse"
                size="small"
              >
                <v-icon start>mdi-cake</v-icon>
                TODAY!
              </v-chip>
            </div>
          </template>

          <template v-slot:[slotItemBirthdate]="{ item }">
            <div class="birthday-details">
              <div class="d-flex align-center mb-1">
                <v-icon :color="isToday(item) ? 'pink' : 'primary'" class="me-2">
                  {{ isToday(item) ? 'mdi-cake-variant' : 'mdi-calendar' }}
                </v-icon>
                <span :class="isToday(item) ? 'font-weight-bold text-pink' : ''">
                  {{ item.birthdate ? date.format(item.birthdate, 'fullDate') : '' }}
                </span>
              </div>
              <div class="text-caption d-flex align-center">
                <span class="me-2">{{ getZodiacSign(item.birthdate) }}</span>
                <v-chip size="x-small" color="purple" variant="outlined">
                  {{ getZodiacSign(item.birthdate).split(' ')[0] }}
                </v-chip>
              </div>
            </div>
          </template>

          <template v-slot:[slotItemAge]="{ item }">
            <div class="text-center age-section">
              <div :class="['text-h6 font-weight-bold', isToday(item) ? 'text-pink animate-bounce' : 'text-primary']">
                {{ getAge(item.birthdate) }}
                <span class="text-caption">years</span>
              </div>
              <div class="text-caption mt-1">
                {{ getBirthdayEmoji(getAge(item.birthdate)) }}
              </div>
              <v-chip 
                size="x-small" 
                :color="isToday(item) ? 'pink' : 'success'" 
                variant="outlined"
                class="mt-1"
              >
                {{ getAgeMilestone(getAge(item.birthdate)) }}
              </v-chip>
            </div>
          </template>

          <template #no-data>
            <v-row class="pa-8" justify="center">
              <div class="text-center">
                <v-icon size="64" color="grey" class="mb-4">mdi-calendar-remove</v-icon>
                <div class="text-h6 text-grey">No birthdays this month</div>
                <div class="text-caption text-grey">But next month might be exciting! 🎈</div>
              </div>
            </v-row>
          </template>
        </v-data-table-server>
      </v-card>

      <!-- Fun Birthday Stats -->
     
    </v-card-text>
  </v-card>
</template>

<style scoped>
.birthday-widget {
  /* background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); */
  border-radius: 16px !important;
  overflow: hidden;
}

.birthday-alert {
  border-radius: 12px !important;
  box-shadow: 0 8px 32px rgba(233, 30, 99, 0.3) !important;
}

.birthday-avatar {
  border: 3px solid #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.birthday-today {
  background: linear-gradient(45deg, #ffeaa7, #fab1a0);
  border-radius: 8px;
  animation: birthday-glow 2s infinite alternate;
}

.birthday-table {
  border-radius: 12px;
  overflow: hidden;
}

.birthday-details {
  padding: 8px 0;
}

.age-section {
  padding: 8px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.02);
}

.birthday-stats .birthday-stat-card {
  border-radius: 12px !important;
  transition: transform 0.3s ease;
}

.birthday-stats .birthday-stat-card:hover {
  transform: translateY(-4px);
}

/* Animations */
@keyframes birthday-glow {
  0% { box-shadow: 0 0 5px rgba(233, 30, 99, 0.5); }
  100% { box-shadow: 0 0 20px rgba(233, 30, 99, 0.8); }
}

.animate-bounce {
  animation: bounce 1s infinite;
}

.animate-pulse {
  animation: pulse 2s infinite;
}

.animate-spin-slow {
  animation: spin 3s linear infinite;
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% { transform: translate3d(0, 0, 0); }
  40%, 43% { transform: translate3d(0, -8px, 0); }
  70% { transform: translate3d(0, -4px, 0); }
  90% { transform: translate3d(0, -2px, 0); }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
