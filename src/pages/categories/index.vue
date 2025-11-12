<script setup>
import CategoryFormDialog from '@/components/categories/CategoryFormDialog.vue'
import { useApi } from '@/composables/useApi'
import { usePermission } from '@/composables/usePermission'
import ApiService from '@/services/api.service'

const { can } = usePermission()

definePage({
  meta: {
    title: 'Categories',
  },
})

// State
const searchQuery = ref('')
const selectedStatus = ref('')
const categories = ref([])
const loading = ref(false)
const totalCategories = ref(0)
const paged = ref(1)
const itemsPerPage = ref(10)
const isFormDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const selectedCategory = ref(null)
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
  { title: 'Category', key: 'name', sortable: false },
  { title: 'Code', key: 'code', sortable: false },
  { title: 'Subject', key: 'subject', sortable: false },
  { title: 'Grade', key: 'grade', sortable: false },
  { title: 'Status', key: 'is_active', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '100px' },
]

// Computed
const totalPages = computed(() => Math.ceil(totalCategories.value / itemsPerPage.value))

const paginationText = computed(() => {
  const start = (paged.value - 1) * itemsPerPage.value + 1
  const end = Math.min(paged.value * itemsPerPage.value, totalCategories.value)
  return `Showing ${start} to ${end} of ${totalCategories.value} results`
})

// Methods
const fetchCategories = async () => {
  loading.value = true
  try {
    const { data, error } = await useApi(createUrl('/categories', {
      query: {
        paged: paged.value,
        itemsPerPage: itemsPerPage.value,
        q: searchQuery.value,
        with: ['subject', 'grade'],
        search: {
          is_active: selectedStatus.value,
        }
      }
    }))

    if (!error.value && data.value) {
      categories.value = data.value.data || []
      totalCategories.value = data.value.total || 0
    }
  } catch (err) {
    console.error('Error fetching categories:', err)
  } finally {
    loading.value = false
  }
}

const handleAddCategory = () => {
  formMode.value = 'add'
  selectedCategory.value = null
  isFormDialogOpen.value = true
}

const handleEditCategory = (category) => {
  formMode.value = 'edit'
  selectedCategory.value = { ...category }
  isFormDialogOpen.value = true
}

const handleDeleteCategory = (category) => {
  selectedCategory.value = category
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!selectedCategory.value) return

  loading.value = true
  ApiService.delete(`/categories/${selectedCategory.value.id}`,
    () => {
      isDeleteDialogOpen.value = false
      fetchCategories()
      loading.value = false
    },
    (error) => {
      console.error('Error deleting category:', error)
      loading.value = false
    }
  )
}

const handleFormSubmit = async () => {
  isFormDialogOpen.value = false
  await fetchCategories()
}

// Watchers
watch([paged, itemsPerPage, searchQuery, selectedStatus], () => {
  fetchCategories()
}, { deep: false })

// Initialize
onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h2 class="text-h4 mb-1">
            Categories
          </h2>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Manage subject-grade combinations
          </p>
        </div>
        <VBtn v-if="can('CATEGORIES.CREATE')" color="primary" prepend-icon="tabler-plus" @click="handleAddCategory">
          Add Category
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
      <VDataTable :headers="headers" :items="categories" :loading="loading" :items-per-page="itemsPerPage"
        hide-default-footer class="category-list-table">
        <!-- ID Column -->
        <template #item.id="{ item, index }">
          <span class="text-body-2 text-medium-emphasis">
            #{{ (paged - 1) * itemsPerPage + index + 1 }}
          </span>
        </template>

        <!-- Name Column -->
        <template #item.name="{ item }">
          <div class="d-flex align-center gap-3">
            <VAvatar :color="item.subject?.color || (item.is_active === 1 ? 'primary' : 'secondary')" size="40">
              <VIcon :icon="item.subject?.icon || 'tabler-category'" size="20" />
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
          <VChip size="small" variant="tonal" color="primary" class="font-weight-medium">
            {{ item.code }}
          </VChip>
        </template>

        <!-- Subject Column -->
        <template #item.subject="{ item }">
          <VChip v-if="item.subject" size="small" variant="outlined" :color="item.subject.color || 'primary'">
            {{ item.subject.name }}
          </VChip>
          <span v-else class="text-body-2 text-medium-emphasis">-</span>
        </template>

        <!-- Grade Column -->
        <template #item.grade="{ item }">
          <VChip v-if="item.grade" size="small" variant="outlined" color="info">
            {{ item.grade.name }}
          </VChip>
          <span v-else class="text-body-2 text-medium-emphasis">-</span>
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
              <VListItem v-if="can('CATEGORIES.UPDATE')" @click="handleEditCategory(item)">
                <template #prepend>
                  <VIcon icon="tabler-edit" size="20" />
                </template>
                <VListItemTitle>Edit</VListItemTitle>
              </VListItem>
              <VListItem v-if="can('CATEGORIES.DELETE')" @click="handleDeleteCategory(item)">
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
              No categories found
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

    <!-- Category Form Dialog -->
    <CategoryFormDialog v-model:is-open="isFormDialogOpen" :mode="formMode" :category="selectedCategory"
      @submit="handleFormSubmit" />

    <!-- Delete Confirmation Dialog -->
    <VDialog v-model="isDeleteDialogOpen" max-width="500">
      <VCard>
        <VCardTitle class="text-h5">
          Confirm Delete
        </VCardTitle>
        <VCardText>
          Are you sure you want to delete category
          <strong>{{ selectedCategory?.name }}</strong>?
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
:deep(.category-list-table) {
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
