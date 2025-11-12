<script setup>
import PointFormDialog from '@/components/points/PointFormDialog.vue'
import { useApi } from '@/composables/useApi'
import { usePermission } from '@/composables/usePermission'
import ApiService from '@/services/api.service'
import { onMounted } from 'vue'

const { can } = usePermission()

definePage({
  meta: {
    title: 'Points',
  },
})

// Search & Filters
const searchQuery = ref('')
const selectedStatus = ref('')

// Data & Pagination
const items = ref([])
const loading = ref(false)
const totalItems = ref(0)
const paged = ref(1)
const itemsPerPage = ref(10)

// Dialog States
const isFormDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const selectedItem = ref(null)
const formMode = ref('add') // 'add' or 'edit'

const statusOptions = [
  { title: 'All Status', value: '' },
  { title: 'Active', value: 1 },
  { title: 'Inactive', value: 0 },
]

// Table Configuration
const headers = [
  { title: 'ID', key: 'id', sortable: false, width: '80px' },
  { title: 'Action Type', key: 'action_type', sortable: false },
  { title: 'Points Value', key: 'points_value', sortable: false, width: '120px' },
  { title: 'Description', key: 'description', sortable: false },
  { title: 'Status', key: 'is_active', sortable: false, width: '100px' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '100px' },
]

const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

const paginationText = computed(() => {
  const start = (paged.value - 1) * itemsPerPage.value + 1
  const end = Math.min(paged.value * itemsPerPage.value, totalItems.value)
  return `Showing ${start} to ${end} of ${totalItems.value} results`
})

// Data Fetching Methods
const fetchItems = async () => {
  loading.value = true
  try {
    const { data, error } = await useApi(createUrl('/points', {
      query: {
        paged: paged.value,
        itemsPerPage: itemsPerPage.value,
        q: searchQuery.value,
        search: {
          is_active: selectedStatus.value,
        }
      }
    }))

    if (!error.value && data.value) {
      items.value = data.value.data || []
      totalItems.value = data.value.total || 0
    }
  } catch (err) {
    console.error('Error fetching items:', err)
  } finally {
    loading.value = false
  }
}

// CRUD Action Handlers
const handleAdd = () => {
  formMode.value = 'add'
  selectedItem.value = null
  isFormDialogOpen.value = true
}

const handleEdit = (item) => {
  formMode.value = 'edit'
  selectedItem.value = { ...item }
  isFormDialogOpen.value = true
}

const handleDelete = (item) => {
  selectedItem.value = item
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!selectedItem.value) return

  loading.value = true
  ApiService.delete(`/points/delete/${selectedItem.value.id}`,
    () => {
      isDeleteDialogOpen.value = false
      fetchItems()
      loading.value = false
    },
    (error) => {
      console.error('Error deleting item:', error)
      loading.value = false
    }
  )
}

const handleFormSubmit = async () => {
  isFormDialogOpen.value = false
  await fetchItems()
}

const handlePageChange = (page) => {
  paged.value = page
}

// Watchers
watch([paged, searchQuery, selectedStatus, itemsPerPage], () => {
  fetchItems()
})

// Initialization
onMounted(() => {
  fetchItems()
})
</script>

<template>
  <div>
    <!-- PAGE HEADER -->
    <div class="mb-6">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h2 class="text-h4 mb-1">Points</h2>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Manage point rules and action types
          </p>
        </div>
        <VBtn v-if="can('POINTS.CREATE')" color="primary" prepend-icon="tabler-plus" @click="handleAdd">
          Add Point Rule
        </VBtn>
      </div>
    </div>

    <!-- FILTERS CARD -->
    <VCard>
      <VCardText>
        <VRow>
          <VCol cols="12" md="6">
            <AppTextField v-model="searchQuery" placeholder="Search..." density="comfortable"
              prepend-inner-icon="tabler-search" />
          </VCol>
          <VCol cols="12" md="6">
            <AppSelect v-model="selectedStatus" :items="statusOptions" item-title="title" item-value="value"
              density="comfortable" />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- DATA TABLE CARD -->
    <VCard class="mt-6">
      <VDataTable :headers="headers" :items="items" :loading="loading" :items-per-page="itemsPerPage"
        hide-default-footer class="data-table">

        <!-- ID Column with Sequential Number -->
        <template #item.id="{ item, index }">
          <span class="text-body-2 text-medium-emphasis">
            #{{ (paged - 1) * itemsPerPage + index + 1 }}
          </span>
        </template>

        <!-- Points Value Column -->
        <template #item.points_value="{ item }">
          <VChip :color="item.points_value >= 0 ? 'success' : 'error'" size="small" variant="tonal"
            class="font-weight-bold">
            {{ item.points_value >= 0 ? '+' : '' }}{{ item.points_value }}
          </VChip>
        </template>

        <!-- Description Column -->
        <template #item.description="{ item }">
          <span class="text-body-2">{{ item.description || '-' }}</span>
        </template>

        <!-- Status Column -->
        <template #item.is_active="{ item }">
          <VChip :color="item.is_active ? 'success' : 'error'" size="small" variant="tonal" class="font-weight-medium">
            {{ item.is_active ? 'Active' : 'Inactive' }}
          </VChip>
        </template>

        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <VMenu>
            <template #activator="{ props }">
              <VBtn icon size="small" variant="text" v-bind="props">
                <VIcon size="20" icon="tabler-dots-vertical" />
              </VBtn>
            </template>

            <VList>
              <VListItem v-if="can('POINTS.UPDATE')" @click="handleEdit(item)">
                <template #prepend>
                  <VIcon icon="tabler-edit" size="20" />
                </template>
                <VListItemTitle>Edit</VListItemTitle>
              </VListItem>
              <VListItem v-if="can('POINTS.DELETE')" @click="handleDelete(item)">
                <template #prepend>
                  <VIcon icon="tabler-trash" size="20" color="error" />
                </template>
                <VListItemTitle class="text-error">Delete</VListItemTitle>
              </VListItem>
            </VList>
          </VMenu>
        </template>

        <!-- Loading State -->
        <template #loading>
          <VSkeletonLoader type="table-row@10" />
        </template>

        <!-- No Data State -->
        <template #no-data>
          <div class="text-center py-8">
            <VIcon size="48" icon="tabler-database-off" class="mb-4" />
            <p class="text-body-1 text-medium-emphasis">No records found</p>
          </div>
        </template>
      </VDataTable>

      <VDivider />

      <!-- PAGINATION -->
      <VCardText>
        <div class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div class="d-flex align-center gap-2">
            <span class="text-body-2 text-medium-emphasis">Rows per page:</span>
            <AppSelect v-model="itemsPerPage" :items="[5, 10, 25, 50]" density="compact" variant="outlined"
              style="max-inline-size: 70px;min-inline-size: 70px;" />
          </div>

          <div class="d-flex align-center gap-4">
            <span class="text-body-2 text-medium-emphasis">
              {{ paginationText }}
            </span>
            <div class="d-flex gap-2">
              <VBtn variant="outlined" size="small" :disabled="paged === 1" @click="paged--">
                Previous
              </VBtn>
              <VBtn variant="outlined" size="small" :disabled="paged >= totalPages" @click="paged++">
                Next
              </VBtn>
            </div>
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- FORM DIALOG -->
    <PointFormDialog v-model:is-open="isFormDialogOpen" :mode="formMode" :item="selectedItem"
      @submit="handleFormSubmit" />

    <!-- DELETE CONFIRMATION DIALOG -->
    <VDialog v-model="isDeleteDialogOpen" max-width="500">
      <VCard>
        <VCardTitle class="text-h5">Confirm Delete</VCardTitle>
        <VCardText>
          Are you sure you want to delete <strong>{{ selectedItem?.action_type }}</strong>?
          This action cannot be undone.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn color="secondary" variant="outlined" @click="isDeleteDialogOpen = false">
            Cancel
          </VBtn>
          <VBtn color="error" :loading="loading" @click="confirmDelete">
            Delete
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
:deep(.data-table) {
  .v-table__wrapper {
    border-radius: 0;
  }

  .v-data-table-header {
    background-color: rgb(var(--v-theme-surface));
  }

  .v-data-table__td,
  .v-data-table__th {
    padding-block: 1rem;
  }
}
</style>
