<script setup>
import GradeFormDialog from '@/components/grades/GradeFormDialog.vue'
import { useApi } from '@/composables/useApi'
import { usePermission } from '@/composables/usePermission'
import ApiService from '@/services/api.service'

const { can } = usePermission()

definePage({
  meta: {
    title: 'Grades',
  },
})

// State
const searchQuery = ref('')
const selectedStatus = ref('')
const grades = ref([])
const loading = ref(false)
const totalGrades = ref(0)
const paged = ref(1)
const itemsPerPage = ref(10)
const isFormDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const selectedGrade = ref(null)
const formMode = ref('add') // 'add' or 'edit'

// Filter options
const statusOptions = [
  { title: 'All Status', value: '' },
  { title: 'Active', value: 1 },
  { title: 'Inactive', value: 0 },
]

// Table headers
const headers = [
  { title: 'ID', key: 'id', sortable: false, width: '80px' },
  { title: 'Name', key: 'name', sortable: false },
  { title: 'Code', key: 'code', sortable: false },
  { title: 'Age Range', key: 'age_range', sortable: false },
  { title: 'Status', key: 'is_active', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '100px' },
]

// Computed
const totalPages = computed(() => Math.ceil(totalGrades.value / itemsPerPage.value))

const paginationText = computed(() => {
  const start = (paged.value - 1) * itemsPerPage.value + 1
  const end = Math.min(paged.value * itemsPerPage.value, totalGrades.value)
  return `Showing ${start} to ${end} of ${totalGrades.value} results`
})

// Methods
const fetchGrades = async () => {
  loading.value = true
  try {
    const { data, error } = await useApi(createUrl('/grades', {
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
      grades.value = data.value.data || []
      totalGrades.value = data.value.total || 0
    }
  } catch (err) {
    console.error('Error fetching grades:', err)
  } finally {
    loading.value = false
  }
}

const handleAddGrade = () => {
  formMode.value = 'add'
  selectedGrade.value = null
  isFormDialogOpen.value = true
}

const handleEditGrade = (grade) => {
  formMode.value = 'edit'
  selectedGrade.value = { ...grade }
  isFormDialogOpen.value = true
}

const handleDeleteGrade = (grade) => {
  selectedGrade.value = grade
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!selectedGrade.value) return

  loading.value = true
  ApiService.delete(`/grades/${selectedGrade.value.id}`,
    () => {
      isDeleteDialogOpen.value = false
      fetchGrades()
      loading.value = false
    },
    (error) => {
      console.error('Error deleting grade:', error)
      loading.value = false
    }
  )
}

const handleFormSubmit = async () => {
  isFormDialogOpen.value = false
  await fetchGrades()
}

// Watchers
watch([paged, itemsPerPage, searchQuery, selectedStatus], () => {
  fetchGrades()
}, { deep: false })

// Initialize
onMounted(() => {
  fetchGrades()
})
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h2 class="text-h4 mb-1">
            Grades
          </h2>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Manage grade levels and age groups
          </p>
        </div>
        <VBtn v-if="can('GRADES.CREATE')" color="primary" prepend-icon="tabler-plus" @click="handleAddGrade">
          Add Grade
        </VBtn>
      </div>
    </div>

    <VCard>
      <!-- Filters -->
      <VCardText>
        <VRow>
          <VCol cols="12" md="9">
            <AppTextField v-model="searchQuery" placeholder="Search by name or code..." density="comfortable"
              prepend-inner-icon="tabler-search" />
          </VCol>
          <VCol cols="12" md="3">
            <AppSelect v-model="selectedStatus" :items="statusOptions" item-title="title" item-value="value"
              density="comfortable" />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <VCard class="mt-6">
      <!-- Data Table -->
      <VDataTable :headers="headers" :items="grades" :loading="loading" :items-per-page="itemsPerPage"
        hide-default-footer class="grade-list-table">
        <!-- ID Column -->
        <template #item.id="{ item, index }">
          <span class="text-body-2 text-medium-emphasis">
            #{{ (paged - 1) * itemsPerPage + index + 1 }}
          </span>
        </template>

        <!-- Name Column -->
        <template #item.name="{ item }">
          <div class="d-flex align-center gap-3">
            <VAvatar :color="item.is_active === 1 ? 'info' : 'secondary'" size="40">
              <VIcon icon="tabler-school" size="20" />
            </VAvatar>
            <div>
              <p class="text-body-1 font-weight-medium mb-0">
                {{ item.name }}
              </p>
              <p v-if="item.description" class="text-caption text-medium-emphasis mb-0">
                {{ item.description }}
              </p>
            </div>
          </div>
        </template>

        <!-- Code Column -->
        <template #item.code="{ item }">
          <VChip size="small" variant="tonal" color="info" class="font-weight-medium">
            {{ item.code }}
          </VChip>
        </template>

        <!-- Age Range Column -->
        <template #item.age_range="{ item }">
          <span v-if="item.min_age && item.max_age" class="text-body-2">
            {{ item.min_age }}-{{ item.max_age }} years
          </span>
          <span v-else-if="item.grade_level" class="text-body-2">
            Level {{ item.grade_level }}
          </span>
          <span v-else class="text-body-2 text-medium-emphasis">
            -
          </span>
        </template>

        <!-- Status Column -->
        <template #item.is_active="{ item }">
          <VChip :color="item.is_active == 1 ? 'success' : 'error'" size="small" variant="tonal"
            class="font-weight-medium">
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
              <VListItem v-if="can('GRADES.UPDATE')" @click="handleEditGrade(item)">
                <template #prepend>
                  <VIcon icon="tabler-edit" size="20" />
                </template>
                <VListItemTitle>Edit</VListItemTitle>
              </VListItem>
              <VListItem v-if="can('GRADES.DELETE')" @click="handleDeleteGrade(item)">
                <template #prepend>
                  <VIcon icon="tabler-trash" size="20" color="error" />
                </template>
                <VListItemTitle class="text-error">
                  Delete
                </VListItemTitle>
              </VListItem>
            </VList>
          </VMenu>
        </template>

        <!-- Loading -->
        <template #loading>
          <VSkeletonLoader type="table-row@10" />
        </template>

        <!-- No Data -->
        <template #no-data>
          <div class="text-center py-8">
            <VIcon size="48" icon="tabler-database-off" class="mb-4" />
            <p class="text-body-1 text-medium-emphasis">
              No grades found
            </p>
          </div>
        </template>
      </VDataTable>

      <VDivider />

      <!-- Pagination -->
      <VCardText>
        <div class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div class="d-flex align-center gap-2">
            <span class="text-body-2 text-medium-emphasis">Rows per page:</span>
            <AppSelect v-model="itemsPerPage" :items="[5, 10, 25, 50]" density="compact" variant="outlined"
              style="max-inline-size: 70px; min-inline-size: 70px;" />
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

    <!-- Grade Form Dialog -->
    <GradeFormDialog v-model:is-open="isFormDialogOpen" :mode="formMode" :grade="selectedGrade"
      @submit="handleFormSubmit" />

    <!-- Delete Confirmation Dialog -->
    <VDialog v-model="isDeleteDialogOpen" max-width="500">
      <VCard>
        <VCardTitle class="text-h5">
          Confirm Delete
        </VCardTitle>
        <VCardText>
          Are you sure you want to delete grade
          <strong>{{ selectedGrade?.name }}</strong>?
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
/* Custom table styling */
:deep(.grade-list-table) {
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
