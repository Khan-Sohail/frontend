<script setup>
import { useApi } from '@/composables/useApi'
import ApiService from '@/services/api.service'
import { onMounted } from 'vue'

definePage({
  meta: {
    title: 'User Points',
  },
})

// Search & Filters
const searchQuery = ref('')
const selectedUser = ref('')
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

// Related Data (for dropdowns/selects)
const userOptions = ref([])
const loadingUsers = ref(false)

const userFilterOptions = ref([{ title: 'All Users', value: '' }])

const statusOptions = [
  { title: 'All Status', value: '' },
  { title: 'Active', value: 1 },
  { title: 'Inactive', value: 0 },
]

// Analytics Chart Data (Static for now - will be updated with API data later)
const selectedPeriod = ref('weekly')

const periodOptions = [
  { title: 'Weekly', value: 'weekly' },
  { title: 'Monthly', value: 'monthly' },
  { title: 'Yearly', value: 'yearly' },
]

// Static data for different periods
const activityData = {
  weekly: {
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    data: [120, 240, 180, 310, 290, 410, 360]
  },
  monthly: {
    categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    data: [850, 920, 780, 1100]
  },
  yearly: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    data: [3200, 3800, 4100, 3900, 4500, 4800, 5200, 5100, 4900, 5400, 5800, 6200]
  }
}

const pointsDistributionChart = {
  series: [{
    name: 'Users',
    data: [44, 55, 41, 37, 22, 43]
  }],
  chartOptions: {
    chart: {
      type: 'bar',
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        horizontal: false,
        columnWidth: '45%',
      }
    },
    dataLabels: {
      enabled: false
    },
    colors: ['#7367F0'],
    xaxis: {
      categories: ['0-50', '51-100', '101-200', '201-500', '501-1000', '1000+'],
      title: { text: 'Points Range' }
    },
    yaxis: {
      title: { text: 'Number of Users' }
    },
    grid: {
      borderColor: '#f1f1f1',
    }
  }
}

const pointsActivityChart = computed(() => ({
  series: [{
    name: 'Points Earned',
    data: activityData[selectedPeriod.value].data
  }],
  chartOptions: {
    chart: {
      type: 'area',
      toolbar: { show: false },
      sparkline: { enabled: false }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.5,
        opacityTo: 0.1,
      }
    },
    colors: ['#28C76F'],
    xaxis: {
      categories: activityData[selectedPeriod.value].categories,
      title: { text: selectedPeriod.value === 'weekly' ? 'Day of Week' : selectedPeriod.value === 'monthly' ? 'Week' : 'Month' }
    },
    yaxis: {
      title: { text: 'Total Points' }
    },
    grid: {
      borderColor: '#f1f1f1',
    }
  }
}))

// Table Configuration
const headers = [
  { title: 'ID', key: 'id', sortable: false, width: '80px' },
  { title: 'User', key: 'user', sortable: false },
  { title: 'Action Type', key: 'point', sortable: false },
  { title: 'Points Earned', key: 'points_earned', sortable: false, width: '120px' },
  { title: 'Action Date', key: 'action_date', sortable: false, width: '120px' },
  { title: 'Status', key: 'is_active', sortable: false, width: '100px' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '100px' },
]

// Computed Properties
const paginationData = computed(() => ({
  page: paged.value,
  itemsPerPage: itemsPerPage.value,
  totalItems: totalItems.value,
}))

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
    const { data, error } = await useApi(createUrl('/user_points', {
      query: {
        paged: paged.value,
        itemsPerPage: itemsPerPage.value,
        q: searchQuery.value,
        search: {
          is_active: selectedStatus.value,
          user_id: selectedUser.value
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

const fetchUsers = async () => {
  loadingUsers.value = true
  try {
    const { data, error } = await useApi('/users').json()
    if (!error.value && data.value) {
      userOptions.value = data.value.data || data.value
      userFilterOptions.value = [
        { title: 'All Users', value: '' },
        ...userOptions.value.map(user => ({
          title: `${user.first_name} ${user.last_name}`,
          value: user.id,
        }))
      ]
    }
  } catch (err) {
    console.error('Error fetching users:', err)
  } finally {
    loadingUsers.value = false
  }
}

// CRUD Action Handlers
const handleEdit = (item) => {
  // Edit functionality can be added later if needed
  console.log('Edit item:', item)
}

const handleDelete = (item) => {
  selectedItem.value = item
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!selectedItem.value) return

  loading.value = true
  ApiService.delete(`/user_points/delete/${selectedItem.value.id}`,
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
watch([paged, searchQuery, selectedUser, selectedStatus, itemsPerPage], () => {
  fetchItems()
})

// Initialization
onMounted(() => {
  fetchUsers()
  fetchItems()
})
</script>

<template>
  <div>
    <!-- PAGE HEADER -->
    <div class="mb-6">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h2 class="text-h4 mb-1">User Points</h2>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Track user points transactions and analytics
          </p>
        </div>
      </div>
    </div>

    <!-- ANALYTICS SECTION -->
    <VRow class="mb-6">
      <VCol cols="12" md="6">
        <VCard>
          <VCardText>
            <h3 class="text-h6 mb-4">Points Distribution</h3>
            <VueApexCharts type="bar" height="300" :options="pointsDistributionChart.chartOptions"
              :series="pointsDistributionChart.series" />
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="6">
        <VCard>
          <VCardText>
            <div class="d-flex align-center justify-space-between mb-4">
              <h3 class="text-h6 mb-0">Points Activity</h3>
              <AppSelect v-model="selectedPeriod" class="flex-grow-0" :items="periodOptions" item-title="title"
                item-value="value" density="compact" style="max-inline-size: 120px;" />
            </div>
            <VueApexCharts type="area" height="300" :options="pointsActivityChart.chartOptions"
              :series="pointsActivityChart.series" />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- FILTERS CARD -->
    <VCard>
      <VCardText>
        <VRow>
          <VCol cols="12" md="4">
            <AppTextField v-model="searchQuery" placeholder="Search..." density="comfortable"
              prepend-inner-icon="tabler-search" />
          </VCol>
          <VCol cols="12" md="4">
            <AppSelect v-model="selectedUser" :items="userFilterOptions" item-title="title" item-value="value"
              density="comfortable" :loading="loadingUsers" />
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

        <!-- User Column -->
        <template #item.user="{ item }">
          <div v-if="item.user" class="d-flex flex-column">
            <span class="text-body-2 font-weight-medium">
              {{ item.user.first_name }} {{ item.user.last_name }}
            </span>
            <span class="text-caption text-medium-emphasis">
              {{ item.user.email }}
            </span>
          </div>
          <span v-else class="text-caption text-disabled">N/A</span>
        </template>

        <!-- Point (Action Type) Column -->
        <template #item.point="{ item }">
          <span v-if="item.point" class="text-body-2">
            {{ item.point.action_type }}
          </span>
          <span v-else class="text-caption text-disabled">N/A</span>
        </template>

        <!-- Points Earned Column -->
        <template #item.points_earned="{ item }">
          <VChip :color="item.points_earned >= 0 ? 'success' : 'error'" size="small" variant="tonal"
            class="font-weight-bold">
            {{ item.points_earned >= 0 ? '+' : '' }}{{ item.points_earned }}
          </VChip>
        </template>

        <!-- Action Date Column -->
        <template #item.action_date="{ item }">
          <span class="text-body-2">{{ item.action_date || '-' }}</span>
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
              <VListItem @click="handleEdit(item)">
                <template #prepend>
                  <VIcon icon="tabler-edit" size="20" />
                </template>
                <VListItemTitle>Edit</VListItemTitle>
              </VListItem>
              <VListItem @click="handleDelete(item)">
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

    <!-- DELETE CONFIRMATION DIALOG -->
    <VDialog v-model="isDeleteDialogOpen" max-width="500">
      <VCard>
        <VCardTitle class="text-h5">Confirm Delete</VCardTitle>
        <VCardText>
          Are you sure you want to delete this user point record?
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
