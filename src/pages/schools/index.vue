<script setup>
import { useApi } from '@/composables/useApi'
import { usePermission } from '@/composables/usePermission'
import ApiService from '@/services/api.service'
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const { can } = usePermission()

definePage({
  meta: {
    title: 'Schools',
  },
})

const router = useRouter()

// Search & Filters
const searchQuery = ref('')
const selectedType = ref('')
const selectedStatus = ref('')

// Data & Pagination
const items = ref([])
const loading = ref(false)
const totalItems = ref(0)
const paged = ref(1)
const itemsPerPage = ref(10)

// Dialog States
const isDeleteDialogOpen = ref(false)
const selectedItem = ref(null)

const typeOptions = [
  { title: 'All Types', value: '' },
  { title: 'Private', value: 'PRIVATE' },
  { title: 'Public', value: 'PUBLIC' },
  { title: 'Government', value: 'GOVERNMENT' },
]

const statusOptions = [
  { title: 'All Status', value: '' },
  { title: 'Active', value: 1 },
  { title: 'Inactive', value: 0 },
]

// Table Configuration
const headers = [
  { title: 'ID', key: 'id', sortable: false, width: '80px' },
  { title: 'Code', key: 'code', sortable: false, width: '120px' },
  { title: 'Name', key: 'name', sortable: false },
  { title: 'City', key: 'city', sortable: false },
  { title: 'Type', key: 'type', sortable: false, width: '120px' },
  { title: 'Email', key: 'email', sortable: false },
  { title: 'Phone', key: 'phone', sortable: false },
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
    const { data, error } = await useApi(createUrl('/schools', {
      query: {
        paged: paged.value,
        itemsPerPage: itemsPerPage.value,
        q: searchQuery.value,
        search: {
          is_active: selectedStatus.value,
          type: selectedType.value,
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
  router.push({ name: 'schools-create' })
}

const handleEdit = (item) => {
  router.push({ name: 'schools-edit', params: { id: item.id } })
}

const handleDelete = (item) => {
  selectedItem.value = item
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!selectedItem.value) return

  loading.value = true
  ApiService.delete(`/schools/delete/${selectedItem.value.id}`,
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

// Watchers
watch([paged, searchQuery, selectedType, selectedStatus, itemsPerPage], () => {
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
          <h2 class="text-h4 mb-1">Schools</h2>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Manage school records and information
          </p>
        </div>
        <VBtn v-if="can('SCHOOLS.CREATE')" color="primary" prepend-icon="tabler-plus" @click="handleAdd">
          Add School
        </VBtn>
      </div>
    </div>

    <!-- FILTERS CARD -->
    <VCard>
      <VCardText>
        <VRow>
          <VCol cols="12" md="4">
            <AppTextField v-model="searchQuery" placeholder="Search by name, code, city..." density="comfortable"
              prepend-inner-icon="tabler-search" />
          </VCol>
          <VCol cols="12" md="4">
            <AppSelect v-model="selectedType" :items="typeOptions" item-title="title" item-value="value"
              density="comfortable" />
          </VCol>
          <VCol cols="12" md="4">
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

        <!-- Code Column -->
        <template #item.code="{ item }">
          <VChip size="small" variant="tonal" color="primary" class="font-weight-medium">
            {{ item.code }}
          </VChip>
        </template>

        <!-- Type Column -->
        <template #item.type="{ item }">
          <VChip
            :color="item.type === 'PRIVATE' ? 'success' : item.type === 'PUBLIC' ? 'info' : 'warning'"
            size="small"
            variant="tonal"
            class="font-weight-medium">
            {{ item.type }}
          </VChip>
        </template>

        <!-- City Column -->
        <template #item.city="{ item }">
          <span class="text-body-2">{{ item.city || '-' }}</span>
        </template>

        <!-- Email Column -->
        <template #item.email="{ item }">
          <span class="text-body-2">{{ item.email || '-' }}</span>
        </template>

        <!-- Phone Column -->
        <template #item.phone="{ item }">
          <span class="text-body-2">{{ item.phone || '-' }}</span>
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
              <VListItem v-if="can('SCHOOLS.UPDATE')" @click="handleEdit(item)">
                <template #prepend>
                  <VIcon icon="tabler-edit" size="20" />
                </template>
                <VListItemTitle>Edit</VListItemTitle>
              </VListItem>
              <VListItem v-if="can('SCHOOLS.DELETE')" @click="handleDelete(item)">
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
            <p class="text-body-1 text-medium-emphasis">No schools found</p>
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

    <!-- DELETE CONFIRMATION DIALOG -->
    <VDialog v-model="isDeleteDialogOpen" max-width="500">
      <VCard>
        <VCardTitle class="text-h5">Confirm Delete</VCardTitle>
        <VCardText>
          Are you sure you want to delete school <strong>{{ selectedItem?.name }}</strong> ({{ selectedItem?.code }})?
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
