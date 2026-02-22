<script setup lang="ts">
import { useCashAdvanceRequestsTable } from './cashAdvanceRequestsTable'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { requestStatusColors } from '@/utils/helpers/constants'
import AppAlert from '@/components/common/AppAlert.vue'
import { getMoneyText } from '@/utils/helpers/others'
import { useDisplay } from 'vuetify'
import { useDate } from 'vuetify'

const date = useDate()
const { smAndDown } = useDisplay()

const {
  tableHeaders,
  tableOptions,
  tableFilters,
  isApprover,
  isRequestor,
  // isDialogVisible,
  isConfirmDeleteDialog,
  // itemData,
  formAction,
  onAdd,
  onStatus,
  onLogs,
  onUpdate,
  onDelete,
  onConfirmDelete,
  onFilterDate,
  onFilterItems,
  onLoadItems,
  cashAdvanceRequestsStore,
  employeesStore,
} = useCashAdvanceRequestsTable()
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
        :items="cashAdvanceRequestsStore.cashAdvanceRequestsTable"
        :items-length="cashAdvanceRequestsStore.cashAdvanceRequestsTableTotal"
        @update:options="onLoadItems"
        :hide-default-header="smAndDown"
        :mobile="smAndDown"
      >
        <template #top>
          <v-row dense>
            <v-spacer></v-spacer>

            <v-col cols="12" sm="4">
              <v-autocomplete
                v-model="tableFilters.employee_id"
                :items="employeesStore.employees"
                density="compact"
                label="Filter by Employee"
                item-title="label"
                item-value="id"
                clearable
                @update:model-value="onFilterItems"
              ></v-autocomplete>
            </v-col>

            <v-col cols="12" sm="3">
              <v-date-input
                v-model="tableFilters.request_at"
                prepend-icon=""
                prepend-inner-icon="mdi-calendar"
                density="compact"
                label="Request Date"
                multiple="range"
                clearable
                @click:clear="onFilterDate(true)"
                @update:model-value="onFilterDate(false)"
              ></v-date-input>
            </v-col>

            <v-col cols="12" sm="3">
              <v-btn class="my-1" prepend-icon="mdi-plus" color="primary" block @click="onAdd">
                Add Cash Advance
              </v-btn>
            </v-col>
          </v-row>

          <v-divider class="my-5"></v-divider>
        </template>

        <template #item.employee="{ item }">
          <span class="font-weight-bold">
            {{ item.employee.lastname + ', ' + item.employee.firstname }}
          </span>
        </template>

        <template #item.amount="{ item }">
          <span class="font-weight-black">
            {{ getMoneyText(item.amount) }}
          </span>
        </template>

        <template #item.request_at="{ item }">
          <span class="font-weight-bold">
            {{ date.format(item.request_at, 'fullDateTime') }}
          </span>
        </template>

        <template #item.status="{ item }">
          <v-chip
            :color="requestStatusColors[item.status] || 'warning'"
            class="font-weight-bold"
            variant="flat"
            size="small"
          >
            {{ item.status }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center" :class="smAndDown ? 'justify-end' : 'justify-center'">
            <template v-if="item.status === 'Pending'">
              <template v-if="isApprover">
                <v-btn variant="text" density="comfortable" @click="onStatus(item)" icon>
                  <v-icon icon="mdi-thumbs-up-down" color="warning"></v-icon>
                  <v-tooltip activator="parent" location="top">Approve or Reject</v-tooltip>
                </v-btn>
              </template>

              <template v-if="isRequestor">
                <v-btn variant="text" density="comfortable" @click="onUpdate(item)" icon>
                  <v-icon icon="mdi-pencil"></v-icon>
                  <v-tooltip activator="parent" location="top">Edit Cash Advance Request</v-tooltip>
                </v-btn>

                <v-btn variant="text" density="comfortable" @click="onDelete(item.id)" icon>
                  <v-icon icon="mdi-trash-can" color="secondary"></v-icon>
                  <v-tooltip activator="parent" location="top">
                    Delete Cash Advance Request
                  </v-tooltip>
                </v-btn>
              </template>
            </template>

            <template v-else-if="item.status === 'Rejected'">
              <template v-if="isRequestor">
                <v-btn variant="text" density="comfortable" @click="onLogs(item)" icon>
                  <v-icon icon="mdi-information-outline" color="warning"></v-icon>
                  <v-tooltip activator="parent" location="top">Resubmit Request</v-tooltip>
                </v-btn>

                <v-btn variant="text" density="comfortable" @click="onUpdate(item)" icon>
                  <v-icon icon="mdi-pencil"></v-icon>
                  <v-tooltip activator="parent" location="top">Edit Cash Advance Request</v-tooltip>
                </v-btn>

                <v-btn variant="text" density="comfortable" @click="onDelete(item.id)" icon>
                  <v-icon icon="mdi-trash-can" color="secondary"></v-icon>
                  <v-tooltip activator="parent" location="top">
                    Delete Cash Advance Request
                  </v-tooltip>
                </v-btn>
              </template>
            </template>
          </div>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>

  <!-- <CashAdvancesFormDialog
    v-model:is-dialog-visible="isDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
    :table-filters="tableFilters"
  ></CashAdvancesFormDialog> -->

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmDeleteDialog"
    title="Confirm Delete"
    text="Are you sure you want to delete this cash advance?"
    @confirm="onConfirmDelete"
  ></ConfirmDialog>
</template>
