<script setup>
import { useApi } from '@/composables/useApi'
import ApiService from '@/services/api.service'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  teacher: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:isOpen', 'submit'])

// State
const loading = ref(false)
const loadingStudents = ref(false)
const availableStudents = ref([])
const selectedStudents = ref([])
const searchQuery = ref('')
const { encryptIt } = useCrypto()

// Computed
const dialogTitle = computed(() => {
  return props.teacher ? `Assign Students to ${props.teacher.first_name} ${props.teacher.last_name}` : 'Assign Students'
})

const filteredStudents = computed(() => {
  if (!searchQuery.value) return availableStudents.value

  const query = searchQuery.value.toLowerCase()
  return availableStudents.value.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase()
    const email = (student.email || '').toLowerCase()
    return fullName.includes(query) || email.includes(query)
  })
})

// Methods
const closeDialog = () => {
  emit('update:isOpen', false)
  selectedStudents.value = []
  searchQuery.value = ''
}

const fetchStudents = async () => {
  if (!props.teacher) return

  loadingStudents.value = true
  try {
    // Fetch all students (you might want to add pagination here)
    const { data, error } = await useApi(createUrl('/students', {
      query: {
        paged: 1,
        itemsPerPage: 1000, // Get all students
        search: {
          school_id: props.teacher.school_id || '',
        }
      }
    }))

    if (!error.value && data.value) {
      availableStudents.value = data.value.data || []
    }

    // Fetch currently assigned students
    const encryptedId = encryptIt(String(props.teacher.id))
    const { data: assignedData, error: assignedError } = await useApi(`/teachers/${encryptedId}/students`).json()

    if (!assignedError.value && assignedData.value) {
      const assigned = assignedData.value.data || assignedData.value
      selectedStudents.value = assigned.map(s => s.id)
    }
  } catch (err) {
    console.error('Error fetching students:', err)
  } finally {
    loadingStudents.value = false
  }
}

const handleSubmit = async () => {
  if (!props.teacher) return

  loading.value = true

  const encryptedId = encryptIt(String(props.teacher.id))

  ApiService.post(`/teachers/${encryptedId}/assign-students`, { student_ids: selectedStudents.value },
    (data) => {
      emit('submit')
      closeDialog()
      loading.value = false
    },
    (error) => {
      console.error('Error assigning students:', error)
      loading.value = false
    }
  )
}

// Watchers
watch(() => props.isOpen, (newVal) => {
  if (newVal && props.teacher) {
    fetchStudents()
  }
})
</script>

<template>
  <VDialog :model-value="isOpen" max-width="700" persistent @update:model-value="closeDialog">
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <span class="text-h5">{{ dialogTitle }}</span>
        <VBtn icon variant="text" size="small" @click="closeDialog">
          <VIcon icon="tabler-x" />
        </VBtn>
      </VCardTitle>

      <VDivider />

      <VCardText>
        <div class="mb-4">
          <AppTextField
            v-model="searchQuery"
            placeholder="Search students by name or email..."
            density="comfortable"
            prepend-inner-icon="tabler-search"
          />
        </div>

        <div v-if="loadingStudents" class="text-center py-8">
          <VProgressCircular indeterminate color="primary" />
          <p class="text-body-2 text-medium-emphasis mt-4">Loading students...</p>
        </div>

        <div v-else-if="availableStudents.length === 0" class="text-center py-8">
          <VIcon size="48" icon="tabler-user-off" class="mb-4 text-disabled" />
          <p class="text-body-1 text-medium-emphasis">No students available</p>
        </div>

        <div v-else>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Select students to assign to this teacher ({{ selectedStudents.length }} selected)
          </p>

          <VCard variant="outlined" class="pa-4" style="max-height: 400px; overflow-y: auto;">
            <VList>
              <VListItem
                v-for="student in filteredStudents"
                :key="student.id"
                @click="() => {
                  const index = selectedStudents.indexOf(student.id)
                  if (index > -1) {
                    selectedStudents.splice(index, 1)
                  } else {
                    selectedStudents.push(student.id)
                  }
                }">
                <template #prepend>
                  <VCheckbox
                    :model-value="selectedStudents.includes(student.id)"
                    hide-details
                  />
                </template>

                <VListItemTitle>
                  {{ student.first_name }} {{ student.last_name }}
                </VListItemTitle>

                <VListItemSubtitle>
                  {{ student.email || 'No email' }}
                  <VChip v-if="student.school" size="x-small" variant="tonal" color="info" class="ml-2">
                    {{ student.school.name }}
                  </VChip>
                </VListItemSubtitle>
              </VListItem>
            </VList>

            <div v-if="filteredStudents.length === 0" class="text-center py-4">
              <p class="text-body-2 text-disabled">No students match your search</p>
            </div>
          </VCard>
        </div>
      </VCardText>

      <VDivider />

      <VCardActions>
        <VSpacer />
        <VBtn color="secondary" variant="outlined" @click="closeDialog">
          Cancel
        </VBtn>
        <VBtn
          color="primary"
          :loading="loading"
          :disabled="selectedStudents.length === 0"
          @click="handleSubmit">
          Assign {{ selectedStudents.length }} Student{{ selectedStudents.length === 1 ? '' : 's' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
