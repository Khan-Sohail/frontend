<script setup>
import { useApi } from '@/composables/useApi'
import { usePermission } from '@/composables/usePermission'
import { onMounted } from 'vue'

const { can } = usePermission()

definePage({
  meta: {
    title: 'Super Admin Dashboard',
  },
})

// Position Filter
const selectedPosition = ref('')

// Platform Overview Stats
const platformStats = ref({
  total_users: 0,
  total_schools: 0,
  total_students: 0,
  total_teachers: 0,
  active_today: 0,
})

// User Growth Data (30 days)
const userGrowthData = ref({
  categories: [],
  series: []
})

// Position Breakdown Data
const positionBreakdownData = ref({
  labels: [],
  series: []
})

// Top Schools
const topSchools = ref([])

const loading = ref(true)

// Fetch Platform Overview
const fetchPlatformOverview = async () => {
  try {
    const { data, error } = await useApi(createUrl('/analytics/platform-overview', {
      query: {
        search: {
          'roles.name': ['!=ADMIN', '!=SUPER ADMIN']
        }
      }
    })).json()
    if (!error.value && data.value) {
      platformStats.value = data.value.data
    }
  } catch (err) {
    console.error('Error fetching platform overview:', err)
  }
}

// Fetch User Growth (30 days)
const fetchUserGrowth = async () => {
  try {
    const queryParams = { days: 30 }
    if (selectedPosition.value) {
      queryParams.position_id = selectedPosition.value
    }

    const { data, error } = await useApi(createUrl('/analytics/user-growth', {
      query: queryParams
    })).json()

    if (!error.value && data.value) {
      const growthData = data.value.data
      userGrowthData.value = {
        categories: growthData.daily_registrations.map(item => item.date),
        series: growthData.daily_registrations.map(item => item.count)
      }
    }
  } catch (err) {
    console.error('Error fetching user growth:', err)
  }
}

// Fetch Position Breakdown
const fetchPositionBreakdown = async () => {
  try {
    const { data, error } = await useApi('/analytics/position-breakdown').json()

    if (!error.value && data.value) {
      const breakdown = data.value.data.position_breakdown
      positionBreakdownData.value = {
        labels: breakdown.map(item => item.position_name),
        series: breakdown.map(item => item.total_count)
      }
    }
  } catch (err) {
    console.error('Error fetching position breakdown:', err)
  }
}

// Fetch Top Schools
const fetchTopSchools = async () => {
  try {
    const { data, error } = await useApi(createUrl('/analytics/school-performance', {
      query: { limit: 5 }
    })).json()

    if (!error.value && data.value) {
      topSchools.value = data.value.data.top_schools
    }
  } catch (err) {
    console.error('Error fetching top schools:', err)
  }
}

// Load all data
const loadDashboardData = async () => {
  loading.value = true
  await Promise.all([
    fetchPlatformOverview(),
    fetchUserGrowth(),
    fetchPositionBreakdown(),
    fetchTopSchools()
  ])
  loading.value = false
}

// Chart Options
const userGrowthChartOptions = computed(() => ({
  chart: {
    type: 'line',
    height: 350,
    toolbar: {
      show: false
    }
  },
  stroke: {
    curve: 'smooth',
    width: 3
  },
  colors: ['#7367F0'],
  xaxis: {
    categories: userGrowthData.value.categories,
    labels: {
      rotate: -45,
      rotateAlways: false
    }
  },
  yaxis: {
    title: {
      text: 'New Registrations'
    }
  },
  title: {
    text: 'User Growth (Last 30 Days)',
    align: 'left'
  },
  grid: {
    borderColor: '#e7e7e7',
  },
  dataLabels: {
    enabled: false
  }
}))

const positionChartOptions = computed(() => ({
  chart: {
    type: 'pie',
    height: 350
  },
  labels: positionBreakdownData.value.labels,
  colors: ['#7367F0', '#28C76F', '#EA5455', '#FF9F43', '#00CFE8'],
  legend: {
    position: 'bottom'
  },
  title: {
    text: 'Users by Position',
    align: 'left'
  },
  responsive: [{
    breakpoint: 480,
    options: {
      chart: {
        width: 300
      },
      legend: {
        position: 'bottom'
      }
    }
  }]
}))

// Watch position filter changes
watch(selectedPosition, () => {
  loadDashboardData()
})

// Initialization
onMounted(() => {
  loadDashboardData()
})
</script>

<template>
  <div>
    <!-- PAGE HEADER -->
    <div class="mb-6">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h2 class="text-h4 mb-1">Super Admin Dashboard</h2>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Platform overview and analytics
          </p>
        </div>
        <div class="d-flex gap-2">
          <VBtn color="primary" prepend-icon="tabler-refresh" @click="loadDashboardData" :loading="loading">
            Refresh
          </VBtn>
        </div>
      </div>
    </div>

    <!-- STATS CARDS -->
    <VRow>
      <VCol cols="12" sm="6" md="4">
        <VCard>
          <VCardText class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption text-uppercase text-disabled">Total Users</div>
              <div class="text-h4 font-weight-bold">
                {{ loading ? '...' : platformStats.total_users.toLocaleString() }}
              </div>
              <div class="text-caption text-success mt-1">
                <VIcon size="16" icon="tabler-trending-up" />
                All time
              </div>
            </div>
            <VAvatar size="48" color="primary" variant="tonal">
              <VIcon size="32" icon="tabler-users" />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" sm="6" md="4">
        <VCard>
          <VCardText class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption text-uppercase text-disabled">Total Schools</div>
              <div class="text-h4 font-weight-bold">
                {{ loading ? '...' : platformStats.total_schools.toLocaleString() }}
              </div>
              <div class="text-caption text-info mt-1">
                <VIcon size="16" icon="tabler-building" />
                Active institutions
              </div>
            </div>
            <VAvatar size="48" color="info" variant="tonal">
              <VIcon size="32" icon="tabler-building" />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" sm="6" md="4">
        <VCard>
          <VCardText class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption text-uppercase text-disabled">Total Students</div>
              <div class="text-h4 font-weight-bold">
                {{ loading ? '...' : platformStats.total_students.toLocaleString() }}
              </div>
              <div class="text-caption text-success mt-1">
                <VIcon size="16" icon="tabler-user-check" />
                Enrolled learners
              </div>
            </div>
            <VAvatar size="48" color="success" variant="tonal">
              <VIcon size="32" icon="tabler-school" />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" sm="6" md="4">
        <VCard>
          <VCardText class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption text-uppercase text-disabled">Total Teachers</div>
              <div class="text-h4 font-weight-bold">
                {{ loading ? '...' : platformStats.total_teachers.toLocaleString() }}
              </div>
              <div class="text-caption text-warning mt-1">
                <VIcon size="16" icon="tabler-user-star" />
                Active educators
              </div>
            </div>
            <VAvatar size="48" color="warning" variant="tonal">
              <VIcon size="32" icon="tabler-user-star" />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="4">
        <VCard>
          <VCardText class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption text-uppercase text-disabled">Total School Admin</div>
              <div class="text-h4 font-weight-bold">
                {{ loading ? '...' : platformStats.total_school_admin.toLocaleString() }}
              </div>
              <div class="text-caption text-primary mt-1">
                <VIcon size="16" icon="tabler-school" />
                Active School Admin
              </div>
            </div>
            <VAvatar size="48" color="primary" variant="tonal">
              <VIcon size="32" icon="tabler-school" />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" sm="6" md="4">
        <VCard>
          <VCardText class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption text-uppercase text-disabled">Active Today</div>
              <div class="text-h4 font-weight-bold">
                {{ loading ? '...' : platformStats.active_today.toLocaleString() }}
              </div>
              <div class="text-caption text-error mt-1">
                <VIcon size="16" icon="tabler-activity" />
                Live users
              </div>
            </div>
            <VAvatar size="48" color="error" variant="tonal">
              <VIcon size="32" icon="tabler-activity" />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- CHARTS ROW -->
    <VRow class="mt-6">
      <!-- USER GROWTH CHART -->
      <VCol cols="12" md="8">
        <VCard>
          <VCardText>
            <VueApexCharts v-if="!loading && userGrowthData.categories.length > 0" type="line" height="350"
              :options="userGrowthChartOptions" :series="[{ name: 'New Users', data: userGrowthData.series }]" />
            <div v-else-if="loading" class="text-center py-12">
              <VProgressCircular indeterminate color="primary" />
            </div>
            <div v-else class="text-center py-12">
              <VIcon size="48" icon="tabler-chart-line" class="mb-4 text-disabled" />
              <p class="text-body-1 text-medium-emphasis">No growth data available</p>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- POSITION BREAKDOWN CHART -->
      <VCol cols="12" md="4">
        <VCard>
          <VCardText>
            <VueApexCharts v-if="!loading && positionBreakdownData.series.length > 0" type="pie" height="350"
              :options="positionChartOptions" :series="positionBreakdownData.series" />
            <div v-else-if="loading" class="text-center py-12">
              <VProgressCircular indeterminate color="primary" />
            </div>
            <div v-else class="text-center py-12">
              <VIcon size="48" icon="tabler-chart-pie" class="mb-4 text-disabled" />
              <p class="text-body-1 text-medium-emphasis">No position data available</p>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- TOP SCHOOLS TABLE -->
    <VCard class="mt-6">
      <VCardTitle class="d-flex align-center justify-space-between">
        <span>Top Schools by Student Count</span>
        <VChip size="small" color="primary">
          Top 5
        </VChip>
      </VCardTitle>
      <VDivider />
      <VCardText>
        <VTable v-if="!loading && topSchools.length > 0" class="top-schools-table">
          <thead>
            <tr>
              <th>School Name</th>
              <th>Code</th>
              <th>Type</th>
              <th>City</th>
              <th>Students</th>
              <th>Teachers</th>
              <th>Capacity Usage</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(school, index) in topSchools" :key="school.id">
              <td>
                <div class="d-flex align-center">
                  <VAvatar size="32" :color="index === 0 ? 'primary' : 'secondary'" variant="tonal" class="me-2">
                    <span class="text-sm font-weight-bold">{{ index + 1 }}</span>
                  </VAvatar>
                  <span class="font-weight-medium">{{ school.name }}</span>
                </div>
              </td>
              <td>
                <VChip size="small" variant="tonal" color="primary">
                  {{ school.code }}
                </VChip>
              </td>
              <td>
                <VChip size="small" variant="tonal"
                  :color="school.type === 'PRIVATE' ? 'success' : school.type === 'PUBLIC' ? 'info' : 'warning'">
                  {{ school.type }}
                </VChip>
              </td>
              <td>{{ school.city || '-' }}</td>
              <td>
                <span class="font-weight-bold text-success">{{ school.students_count }}</span>
              </td>
              <td>
                <span class="font-weight-bold text-info">{{ school.teachers_count }}</span>
              </td>
              <td>
                <VProgressLinear :model-value="parseFloat(school.capacity_usage)"
                  :color="parseFloat(school.capacity_usage) > 80 ? 'error' : parseFloat(school.capacity_usage) > 60 ? 'warning' : 'success'"
                  height="20" rounded>
                  <template #default>
                    <span class="text-caption text-white">{{ school.capacity_usage }}</span>
                  </template>
                </VProgressLinear>
              </td>
              <td>
                <VChip size="small" variant="tonal" :color="school.is_active ? 'success' : 'error'">
                  {{ school.is_active ? 'Active' : 'Inactive' }}
                </VChip>
              </td>
            </tr>
          </tbody>
        </VTable>

        <!-- Loading State -->
        <div v-else-if="loading" class="text-center py-8">
          <VProgressCircular indeterminate color="primary" />
          <p class="text-body-2 text-medium-emphasis mt-4">Loading top schools...</p>
        </div>

        <!-- No Data State -->
        <div v-else class="text-center py-8">
          <VIcon size="48" icon="tabler-database-off" class="mb-4" />
          <p class="text-body-1 text-medium-emphasis">No schools found</p>
        </div>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
.top-schools-table {
  :deep(thead) {
    background-color: rgb(var(--v-theme-surface));
  }

  :deep(th) {
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.5px;
  }

  :deep(td) {
    padding-block: 1rem;
  }
}
</style>
