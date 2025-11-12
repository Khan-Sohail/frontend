<script setup>
import { useApi } from '@/composables/useApi'
import { usePermission } from '@/composables/usePermission'
import { onMounted } from 'vue'

const { can } = usePermission()

definePage({
  meta: {
    title: 'Analytics',
  },
})

// Date Range Selection
const dateRangeOptions = [
  { title: 'Last 7 Days', value: 7 },
  { title: 'Last 14 Days', value: 14 },
  { title: 'Last 30 Days', value: 30 },
  { title: 'Last 60 Days', value: 60 },
  { title: 'Last 90 Days', value: 90 },
]

const selectedDays = ref(30)
const loading = ref(false)

// Position Filter
const selectedPosition = ref('')
const positions = ref([])
const loadingPositions = ref(false)

const positionOptions = computed(() => [
  { title: 'All Positions', value: '' },
  ...positions.value.map(position => ({
    title: position.name,
    value: position.id,
  }))
])

// DAU/MAU Data
const dauData = ref({
  date: '',
  dau: 0,
  hourly_breakdown: {}
})

const mauData = ref({
  month: 0,
  year: 0,
  mau: 0,
  current_dau: 0,
  engagement_rate: '0%',
  daily_breakdown: {}
})

// User Activity Data
const activityData = ref({
  daily_activities: [],
  activity_type_breakdown: []
})

// Fetch DAU
const fetchDAU = async () => {
  try {
    const { data, error } = await useApi('/analytics/dau').json()
    if (!error.value && data.value) {
      dauData.value = data.value.data
    }
  } catch (err) {
    console.error('Error fetching DAU:', err)
  }
}

// Fetch MAU
const fetchMAU = async () => {
  try {
    const { data, error } = await useApi('/analytics/mau').json()
    if (!error.value && data.value) {
      mauData.value = data.value.data
    }
  } catch (err) {
    console.error('Error fetching MAU:', err)
  }
}

// Fetch Positions
const fetchPositions = async () => {
  loadingPositions.value = true
  try {
    const { data, error } = await useApi('/positions').json()
    if (!error.value && data.value) {
      positions.value = data.value.data || data.value
    }
  } catch (err) {
    console.error('Error fetching positions:', err)
  } finally {
    loadingPositions.value = false
  }
}

// Fetch User Activity Breakdown
const fetchActivityBreakdown = async () => {
  try {
    const queryParams = { days: selectedDays.value }
    if (selectedPosition.value) {
      queryParams.position_id = selectedPosition.value
    }

    const { data, error } = await useApi(createUrl('/analytics/user-activity-breakdown', {
      query: queryParams
    })).json()

    if (!error.value && data.value) {
      activityData.value = data.value.data
    }
  } catch (err) {
    console.error('Error fetching activity breakdown:', err)
  }
}

// Load all analytics
const loadAnalytics = async () => {
  loading.value = true
  await Promise.all([
    fetchDAU(),
    fetchMAU(),
    fetchActivityBreakdown()
  ])
  loading.value = false
}

// Chart Options
const dauHourlyChartOptions = computed(() => {
  const hours = Object.keys(dauData.value.hourly_breakdown || {})
  const values = Object.values(dauData.value.hourly_breakdown || {})

  return {
    chart: {
      type: 'area',
      height: 350,
      toolbar: {
        show: false
      }
    },
    colors: ['#7367F0'],
    stroke: {
      curve: 'smooth',
      width: 3
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
      }
    },
    xaxis: {
      categories: hours.map(h => `${h}:00`),
      title: {
        text: 'Hour of Day'
      }
    },
    yaxis: {
      title: {
        text: 'Active Users'
      }
    },
    title: {
      text: 'Hourly Active Users (Today)',
      align: 'left'
    },
    dataLabels: {
      enabled: false
    }
  }
})

const mauDailyChartOptions = computed(() => {
  const dates = Object.keys(mauData.value.daily_breakdown || {})
  const values = Object.values(mauData.value.daily_breakdown || {})

  return {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false
      }
    },
    colors: ['#28C76F'],
    plotOptions: {
      bar: {
        borderRadius: 8,
        dataLabels: {
          position: 'top',
        },
      }
    },
    xaxis: {
      categories: dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      labels: {
        rotate: -45
      }
    },
    yaxis: {
      title: {
        text: 'Active Users'
      }
    },
    title: {
      text: 'Daily Active Users (This Month)',
      align: 'left'
    },
    dataLabels: {
      enabled: false
    }
  }
})

const activityTrendsChartOptions = computed(() => {
  const categories = activityData.value.daily_activities.map(item => item.date)

  return {
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: true
      }
    },
    colors: ['#7367F0', '#28C76F'],
    stroke: {
      curve: 'smooth',
      width: 3
    },
    xaxis: {
      categories: categories.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      labels: {
        rotate: -45
      }
    },
    yaxis: [
      {
        title: {
          text: 'Total Activities'
        }
      },
      {
        opposite: true,
        title: {
          text: 'Unique Users'
        }
      }
    ],
    title: {
      text: `Activity Trends (Last ${selectedDays.value} Days)`,
      align: 'left'
    },
    legend: {
      position: 'top'
    },
    dataLabels: {
      enabled: false
    }
  }
})

const activityTypeChartOptions = computed(() => {
  const labels = activityData.value.activity_type_breakdown.map(item => item.activity_type || 'Unknown')
  const series = activityData.value.activity_type_breakdown.map(item => item.count)

  return {
    chart: {
      type: 'donut',
      height: 350
    },
    labels: labels,
    colors: ['#7367F0', '#28C76F', '#EA5455', '#FF9F43', '#00CFE8', '#826AF9'],
    legend: {
      position: 'bottom'
    },
    title: {
      text: 'Activity Type Breakdown',
      align: 'left'
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '16px'
            },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: 'bold'
            },
            total: {
              show: true,
              label: 'Total Activities',
              fontSize: '14px'
            }
          }
        }
      }
    }
  }
})

// Watch date range and position changes
watch([selectedDays, selectedPosition], () => {
  fetchActivityBreakdown()
})

// Initialization
onMounted(() => {
  fetchPositions()
  loadAnalytics()
})
</script>

<template>
  <div>
    <!-- PAGE HEADER -->
    <div class="mb-6">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h2 class="text-h4 mb-1">Analytics Dashboard</h2>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Track user engagement and activity metrics
          </p>
        </div>
        <div class="d-flex gap-2">
          <AppSelect
            v-model="selectedPosition"
            :items="positionOptions"
            item-title="title"
            item-value="value"
            density="compact"
            prepend-inner-icon="tabler-filter"
            :loading="loadingPositions"
            style="min-inline-size: 180px;"
          />
          <AppSelect
            v-model="selectedDays"
            :items="dateRangeOptions"
            item-title="title"
            item-value="value"
            density="compact"
            prepend-inner-icon="tabler-calendar"
            style="min-inline-size: 150px;"
          />
          <VBtn color="primary" prepend-icon="tabler-refresh" @click="loadAnalytics" :loading="loading">
            Refresh
          </VBtn>
        </div>
      </div>
    </div>

    <!-- DAU/MAU STATS CARDS -->
    <VRow>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="text-caption text-uppercase text-disabled mb-2">DAU (Daily Active Users)</div>
            <div class="text-h3 font-weight-bold text-primary">
              {{ loading ? '...' : dauData.dau.toLocaleString() }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ dauData.date }}
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="text-caption text-uppercase text-disabled mb-2">MAU (Monthly Active Users)</div>
            <div class="text-h3 font-weight-bold text-success">
              {{ loading ? '...' : mauData.mau.toLocaleString() }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ mauData.month }}/{{ mauData.year }}
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="text-caption text-uppercase text-disabled mb-2">Engagement Rate</div>
            <div class="text-h3 font-weight-bold text-info">
              {{ loading ? '...' : mauData.engagement_rate }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              DAU/MAU Ratio
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="text-caption text-uppercase text-disabled mb-2">Total Activities</div>
            <div class="text-h3 font-weight-bold text-warning">
              {{ loading ? '...' : activityData.daily_activities.reduce((sum, item) => sum + item.total_activities, 0).toLocaleString() }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              Last {{ selectedDays }} days
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- HOURLY DAU CHART -->
    <VRow class="mt-6">
      <VCol cols="12" md="8">
        <VCard>
          <VCardText>
            <VueApexCharts
              v-if="!loading && Object.keys(dauData.hourly_breakdown).length > 0"
              type="area"
              height="350"
              :options="dauHourlyChartOptions"
              :series="[{ name: 'Active Users', data: Object.values(dauData.hourly_breakdown) }]"
            />
            <div v-else-if="loading" class="text-center py-12">
              <VProgressCircular indeterminate color="primary" />
            </div>
            <div v-else class="text-center py-12">
              <VIcon size="48" icon="tabler-chart-area" class="mb-4 text-disabled" />
              <p class="text-body-1 text-medium-emphasis">No hourly data available</p>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" md="4">
        <VCard>
          <VCardText>
            <VueApexCharts
              v-if="!loading && activityData.activity_type_breakdown.length > 0"
              type="donut"
              height="350"
              :options="activityTypeChartOptions"
              :series="activityData.activity_type_breakdown.map(item => item.count)"
            />
            <div v-else-if="loading" class="text-center py-12">
              <VProgressCircular indeterminate color="primary" />
            </div>
            <div v-else class="text-center py-12">
              <VIcon size="48" icon="tabler-chart-donut" class="mb-4 text-disabled" />
              <p class="text-body-1 text-medium-emphasis">No activity data</p>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- DAILY MAU CHART -->
    <VRow class="mt-6">
      <VCol cols="12">
        <VCard>
          <VCardText>
            <VueApexCharts
              v-if="!loading && Object.keys(mauData.daily_breakdown).length > 0"
              type="bar"
              height="350"
              :options="mauDailyChartOptions"
              :series="[{ name: 'Daily Active Users', data: Object.values(mauData.daily_breakdown) }]"
            />
            <div v-else-if="loading" class="text-center py-12">
              <VProgressCircular indeterminate color="primary" />
            </div>
            <div v-else class="text-center py-12">
              <VIcon size="48" icon="tabler-chart-bar" class="mb-4 text-disabled" />
              <p class="text-body-1 text-medium-emphasis">No daily breakdown available</p>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- ACTIVITY TRENDS CHART -->
    <VRow class="mt-6">
      <VCol cols="12">
        <VCard>
          <VCardText>
            <VueApexCharts
              v-if="!loading && activityData.daily_activities.length > 0"
              type="line"
              height="350"
              :options="activityTrendsChartOptions"
              :series="[
                { name: 'Total Activities', data: activityData.daily_activities.map(item => item.total_activities) },
                { name: 'Unique Users', data: activityData.daily_activities.map(item => item.unique_users) }
              ]"
            />
            <div v-else-if="loading" class="text-center py-12">
              <VProgressCircular indeterminate color="primary" />
            </div>
            <div v-else class="text-center py-12">
              <VIcon size="48" icon="tabler-chart-line" class="mb-4 text-disabled" />
              <p class="text-body-1 text-medium-emphasis">No activity trends available</p>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- ACTIVITY TYPE TABLE -->
    <VCard class="mt-6">
      <VCardTitle>
        Activity Type Breakdown
      </VCardTitle>
      <VDivider />
      <VCardText>
        <VTable v-if="!loading && activityData.activity_type_breakdown.length > 0">
          <thead>
            <tr>
              <th>Activity Type</th>
              <th>Total Count</th>
              <th>Unique Users</th>
              <th>Avg per User</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="activity in activityData.activity_type_breakdown" :key="activity.activity_type">
              <td>
                <VChip size="small" variant="tonal" color="primary">
                  {{ activity.activity_type || 'Unknown' }}
                </VChip>
              </td>
              <td>
                <span class="font-weight-bold">{{ activity.count.toLocaleString() }}</span>
              </td>
              <td>
                <span class="font-weight-medium text-success">{{ activity.unique_users.toLocaleString() }}</span>
              </td>
              <td>
                <span class="text-medium-emphasis">
                  {{ (activity.count / activity.unique_users).toFixed(2) }}
                </span>
              </td>
            </tr>
          </tbody>
        </VTable>

        <!-- Loading State -->
        <div v-else-if="loading" class="text-center py-8">
          <VProgressCircular indeterminate color="primary" />
          <p class="text-body-2 text-medium-emphasis mt-4">Loading activity data...</p>
        </div>

        <!-- No Data State -->
        <div v-else class="text-center py-8">
          <VIcon size="48" icon="tabler-database-off" class="mb-4" />
          <p class="text-body-1 text-medium-emphasis">No activity data available</p>
        </div>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
:deep(.v-table) {
  thead {
    background-color: rgb(var(--v-theme-surface));
  }

  th {
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.5px;
  }

  td {
    padding-block: 1rem;
  }
}
</style>
