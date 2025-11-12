<script setup>
import { useApi } from '@/composables/useApi'
import ApiService from '@/services/api.service'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  student: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:isOpen', 'submit'])

// State
const loading = ref(false)
const loadingTeachers = ref(false)
const availableTeachers = ref([])
const selectedTeachers = ref([])
const searchQuery = ref('')
const { encryptIt } = useCrypto()

// Computed
const dialogTitle = computed(() => {
  return props.student ? `Assign Teachers to ${props.student.first_name} ${props.student.last_name}` : 'Assign Teachers'
})

const filteredTeachers = computed(() => {
  if (!searchQuery.value) return availableTeachers.value

  const query = searchQuery.value.toLowerCase()
  return availableTeachers.value.filter(teacher => {
    const fullName = `${teacher.first_name} ${teacher.last_name}`.toLowerCase()
    const email = (teacher.email || '').toLowerCase()
    return fullName.includes(query) || email.includes(query)
  })
})

// Methods
const closeDialog = () => {
  emit('update:isOpen', false)
  selectedTeachers.value = []
  searchQuery.value = ''
}

const fetchTeachers = async () => {
  if (!props.student) return

  loadingTeachers.value = true
  try {
    // Fetch all teachers (you might want to add pagination here)
    const { data, error } = await useApi(createUrl('/teachers', {
      query: {
        paged: 1,
        itemsPerPage: 1000, // Get all teachers
        search: {
          school_id: props.student.school_id || '',
        }
      }
    }))

    if (!error.value && data.value) {
      availableTeachers.value = data.value.data || []
    }

    // Fetch currently assigned teachers
    const encryptedId = encryptIt(String(props.student.id))
    const { data: assignedData, error: assignedError } = await useApi(`/students/${encryptedId}/teachers`).json()

    if (!assignedError.value && assignedData.value) {
      const assigned = assignedData.value.data || assignedData.value
      selectedTeachers.value = assigned.map(t => t.id)
    }
  } catch (err) {
    console.error('Error fetching teachers:', err)
  } finally {
    loadingTeachers.value = false
  }
}

const handleSubmit = async () => {
  if (!props.student) return

  loading.value = true

  const encryptedId = encryptIt(String(props.student.id))

  ApiService.post(`/students/${encryptedId}/assign-teachers`, { teacher_ids: selectedTeachers.value },
    (data) => {
      emit('submit')
      closeDialog()
      loading.value = false
    },
    (error) => {
      console.error('Error assigning teachers:', error)
      loading.value = false
    }
  )
}

// Watchers
watch(() => props.isOpen, (newVal) => {
  if (newVal && props.student) {
    fetchTeachers()
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
            placeholder="Search teachers by name or email..."
            density="comfortable"
            prepend-inner-icon="tabler-search"
          />
        </div>

        <div v-if="loadingTeachers" class="text-center py-8">
          <VProgressCircular indeterminate color="primary" />
          <p class="text-body-2 text-medium-emphasis mt-4">Loading teachers...</p>
        </div>

        <div v-else-if="availableTeachers.length === 0" class="text-center py-8">
          <VIcon size="48" icon="tabler-user-off" class="mb-4 text-disabled" />
          <p class="text-body-1 text-medium-emphasis">No teachers available</p>
        </div>

        <div v-else>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Select teachers to assign to this student ({{ selectedTeachers.length }} selected)
          </p>

          <VCard variant="outlined" class="pa-4" style="max-height: 400px; overflow-y: auto;">
            <VList>
              <VListItem
                v-for="teacher in filteredTeachers"
                :key="teacher.id"
                @click="() => {
                  const index = selectedTeachers.indexOf(teacher.id)
                  if (index > -1) {
                    selectedTeachers.splice(index, 1)
                  } else {
                    selectedTeachers.push(teacher.id)
                  }
                }">
                <template #prepend>
                  <VCheckbox
                    :model-value="selectedTeachers.includes(teacher.id)"
                    hide-details
                  />
                </template>

                <VListItemTitle>
                  {{ teacher.first_name }} {{ teacher.last_name }}
                </VListItemTitle>

                <VListItemSubtitle>
                  {{ teacher.email || 'No email' }}
                  <VChip v-if="teacher.school" size="x-small" variant="tonal" color="info" class="ml-2">
                    {{ teacher.school.name }}
                  </VChip>
                </VListItemSubtitle>
              </VListItem>
            </VList>

            <div v-if="filteredTeachers.length === 0" class="text-center py-4">
              <p class="text-body-2 text-disabled">No teachers match your search</p>
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
          :disabled="selectedTeachers.length === 0"
          @click="handleSubmit">
          Assign {{ selectedTeachers.length }} Teacher{{ selectedTeachers.length === 1 ? '' : 's' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
