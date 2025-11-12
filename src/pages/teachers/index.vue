<script setup>
import AssignStudentsDialog from '@/components/teachers/AssignStudentsDialog.vue'
import { useApi } from '@/composables/useApi'
import { usePermission } from '@/composables/usePermission'
import ApiService from '@/services/api.service'
import { onMounted } from 'vue'

const { can } = usePermission()

definePage({
  meta: {
    title: 'Teachers',
  },
})

// Search & Filters
const searchQuery = ref('')
const selectedSchool = ref('')
const selectedStatus = ref('')

// Data & Pagination
const items = ref([])
const loading = ref(false)
const totalItems = ref(0)
const paged = ref(1)
const itemsPerPage = ref(10)

// Dialog States
const isAssignDialogOpen = ref(false)
const selectedTeacher = ref(null)

// Schools options for filter
const schools = ref([])
const loadingSchools = ref(false)

const statusOptions = [
  { title: 'All Status', value: '' },
  { title: 'Active', value: 1 },
  { title: 'Inactive', value: 0 },
]

const schoolOptions = computed(() => [
  { title: 'All Schools', value: '' },
  ...schools.value.map(school => ({
    title: school.name,
    value: school.id,
  }))
])

// Table Configuration
const headers = [
  { title: 'ID', key: 'id', sortable: false, width: '80px' },
  { title: 'Name', key: 'full_name', sortable: false },
  { title: 'Email', key: 'email', sortable: false },
  { title: 'Phone', key: 'phone', sortable: false },
  { title: 'School', key: 'school', sortable: false },
  { title: 'Status', key: 'is_active', sortable: false, width: '100px' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '150px' },
]

const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

const paginationText = computed(() => {
  const start = (paged.value - 1) * itemsPerPage.value + 1
  const end = Math.min(paged.value * itemsPerPage.value, totalItems.value)
  return `Showing ${start} to ${end} of ${totalItems.value} results`
})

// Data Fetching Methods
const fetchSchools = async () => {
  loadingSchools.value = true
  try {
    const { data, error } = await useApi('/schools').json()
    if (!error.value && data.value) {
      schools.value = data.value.data || data.value
    }
  } catch (err) {
    console.error('Error fetching schools:', err)
  } finally {
    loadingSchools.value = false
  }
}

const fetchItems = async () => {
  loading.value = true
  try {
    const { data, error } = await useApi(createUrl('/teachers', {
      query: {
        paged: paged.value,
        itemsPerPage: itemsPerPage.value,
        q: searchQuery.value,
        search: {
          is_active: selectedStatus.value,
          school_id: selectedSchool.value,
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

// Action Handlers
const handleAssignStudents = (teacher) => {
  selectedTeacher.value = teacher
  isAssignDialogOpen.value = true
}

const handleAssignSubmit = async () => {
  isAssignDialogOpen.value = false
  await fetchItems()
}

const handlePageChange = (page) => {
  paged.value = page
}

// Watchers
watch([paged, searchQuery, selectedSchool, selectedStatus, itemsPerPage], () => {
  fetchItems()
})

// Initialization
onMounted(() => {
  fetchSchools()
  fetchItems()
})
</script>

<template>
  <div>
    <!-- PAGE HEADER -->
    <div class="mb-6">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h2 class="text-h4 mb-1">Teachers</h2>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Manage teacher records and student assignments
          </p>
        </div>
        <VBtn
          v-if="can('TEACHERS.CREATE')"
          color="primary"
          prepend-icon="tabler-file-import"
          to="/teachers/import"
        >
          Import Teachers
        </VBtn>
      </div>
    </div>

    <!-- FILTERS CARD -->
    <VCard>
      <VCardText>
        <VRow>
          <VCol cols="12" md="4">
            <AppTextField v-model="searchQuery" placeholder="Search by name, email..." density="comfortable"
              prepend-inner-icon="tabler-search" />
          </VCol>
          <VCol cols="12" md="4">
            <AppSelect
              v-model="selectedSchool"
              :items="schoolOptions"
              item-title="title"
              item-value="value"
              density="comfortable"
              :loading="loadingSchools"
            />
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

        <!-- Full Name Column -->
        <template #item.full_name="{ item }">
          <div class="d-flex align-center">
            <VAvatar :size="32" class="me-3" color="primary" variant="tonal">
              <span class="text-sm">{{ item.first_name?.charAt(0) }}{{ item.last_name?.charAt(0) }}</span>
            </VAvatar>
            <div>
              <p class="font-weight-medium mb-0">
                {{ item.first_name }} {{ item.last_name }}
              </p>
              <small class="text-disabled">{{ item.user_name }}</small>
            </div>
          </div>
        </template>

        <!-- Email Column -->
        <template #item.email="{ item }">
          <span class="text-body-2">{{ item.email || '-' }}</span>
        </template>

        <!-- Phone Column -->
        <template #item.phone="{ item }">
          <span class="text-body-2">{{ item.phone || '-' }}</span>
        </template>

        <!-- School Column -->
        <template #item.school="{ item }">
          <VChip v-if="item.school" size="small" variant="tonal" color="info">
            {{ item.school.name }}
          </VChip>
          <span v-else class="text-disabled">-</span>
        </template>

        <!-- Status Column -->
        <template #item.is_active="{ item }">
          <VChip :color="item.is_active ? 'success' : 'error'" size="small" variant="tonal" class="font-weight-medium">
            {{ item.is_active ? 'Active' : 'Inactive' }}
          </VChip>
        </template>

        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <VBtn
            v-if="can('TEACHERS.UPDATE')"
            size="small"
            variant="outlined"
            color="primary"
            prepend-icon="tabler-users"
            @click="handleAssignStudents(item)">
            Assign Students
          </VBtn>
        </template>

        <!-- Loading State -->
        <template #loading>
          <VSkeletonLoader type="table-row@10" />
        </template>

        <!-- No Data State -->
        <template #no-data>
          <div class="text-center py-8">
            <VIcon size="48" icon="tabler-database-off" class="mb-4" />
            <p class="text-body-1 text-medium-emphasis">No teachers found</p>
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

    <!-- ASSIGN STUDENTS DIALOG -->
    <AssignStudentsDialog
      v-model:is-open="isAssignDialogOpen"
      :teacher="selectedTeacher"
      @submit="handleAssignSubmit"
    />
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
