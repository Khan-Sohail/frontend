<script setup>
import { useApi } from '@/composables/useApi'
import { useFormErrors } from '@/composables/useFormErrors'
import ApiService from '@/services/api.service'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  mode: {
    type: String,
    required: true,
    validator: value => ['add', 'edit'].includes(value),
  },
  category: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:isOpen', 'submit'])

// State
const loading = ref(false)
const formValid = ref(false)
const formRef = ref(null)
const subjects = ref([])
const grades = ref([])
const loadingSubjects = ref(false)
const loadingGrades = ref(false)
const { errors, setErrors, clearErrors } = useFormErrors(formRef)

const formData = ref({
  subject_id: null,
  grade_id: null,
  description: '',
  order: 0,
  is_active: 1,
})

// Validation rules
const subjectRules = [requiredValidator]
const gradeRules = [requiredValidator]

// Computed
const dialogTitle = computed(() => {
  return props.mode === 'add' ? 'Add New Category' : 'Edit Category'
})

const submitButtonText = computed(() => {
  return props.mode === 'add' ? 'Create Category' : 'Update Category'
})

const previewName = computed(() => {
  const subject = subjects.value.find(s => s.id === formData.value.subject_id)
  const grade = grades.value.find(g => g.id === formData.value.grade_id)

  if (subject && grade) {
    return `${subject.name} - ${grade.name}`
  }
  return 'Category name will be auto-generated'
})

const previewCode = computed(() => {
  const subject = subjects.value.find(s => s.id === formData.value.subject_id)
  const grade = grades.value.find(g => g.id === formData.value.grade_id)

  if (subject && grade) {
    return `${subject.code}-${grade.code}`
  }
  return 'Category code will be auto-generated'
})

// Methods
const fetchSubjects = async () => {
  loadingSubjects.value = true
  try {
    const { data, error } = await useApi(createUrl('/subjects', {
      query: {
        search: { is_active: 1 }
      }
    }))
    if (!error.value && data.value) {
      subjects.value = data.value.data || data.value
    }
  } catch (err) {
    console.error('Error fetching subjects:', err)
  } finally {
    loadingSubjects.value = false
  }
}

const fetchGrades = async () => {
  loadingGrades.value = true
  try {
    const { data, error } = await useApi(createUrl('/grades', {
      query: {
        search: { is_active: 1 }
      }
    }))
    if (!error.value && data.value) {
      grades.value = data.value.data || data.value
    }
  } catch (err) {
    console.error('Error fetching grades:', err)
  } finally {
    loadingGrades.value = false
  }
}

const closeDialog = () => {
  emit('update:isOpen', false)
  resetForm()
}

const resetForm = () => {
  formData.value = {
    subject_id: null,
    grade_id: null,
    description: '',
    order: 0,
    is_active: 1,
  }
  clearErrors()
  formRef.value?.reset()
}

const initializeForm = () => {
  if (props.mode === 'edit' && props.category) {
    formData.value = {
      subject_id: props.category.subject_id || null,
      grade_id: props.category.grade_id || null,
      description: props.category.description || '',
      order: props.category.order || 0,
      is_active: props.category.is_active !== undefined ? props.category.is_active : 1,
    }
  } else {
    resetForm()
  }
}

const handleSubmit = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  loading.value = true
  clearErrors()

  const payload = { ...formData.value }

  const handleError = (error) => {
    console.error('Form submission error:', error)
    if (error?.data?.errors) {
      setErrors(error.data.errors)
    }
    loading.value = false
  }

  if (props.mode === 'add') {
    ApiService.post('/categories', payload,
      (data) => {
        emit('submit')
        closeDialog()
        loading.value = false
      },
      handleError
    )
  } else {
    payload.id = props.category.id
    ApiService.patch(`/categories/${props.category.id}`, payload,
      (data) => {
        emit('submit')
        closeDialog()
        loading.value = false
      },
      handleError
    )
  }
}

// Watchers
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    fetchSubjects()
    fetchGrades()
    initializeForm()
  }
})
</script>

<template>
  <VDialog :model-value="isOpen" max-width="600" persistent scrollable @update:model-value="closeDialog">
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <span class="text-h5">{{ dialogTitle }}</span>
        <VBtn icon variant="text" size="small" @click="closeDialog">
          <VIcon icon="tabler-x" />
        </VBtn>
      </VCardTitle>

      <VDivider />

      <VCardText style="max-block-size: 70vh;">
        <VForm ref="formRef" v-model="formValid" @submit.prevent="handleSubmit">
          <VRow>
            <!-- Subject Field -->
            <VCol cols="12">
              <AppSelect v-model="formData.subject_id" :items="subjects" item-title="name" item-value="id"
                label="Subject" placeholder="Select a subject" :rules="subjectRules"
                :error-messages="errors.subject_id" :loading="loadingSubjects" required>
                <template #selection="{ item }">
                  <div class="d-flex align-center gap-2">
                    <VAvatar v-if="item.raw.color" :color="item.raw.color" size="24">
                      <VIcon v-if="item.raw.icon" :icon="item.raw.icon" size="14" />
                    </VAvatar>
                    <span>{{ item.raw.name }}</span>
                  </div>
                </template>
                <template #item="{ props: itemProps, item }">
                  <VListItem v-bind="itemProps">
                    <template #prepend>
                      <VAvatar v-if="item.raw.color" :color="item.raw.color" size="32">
                        <VIcon v-if="item.raw.icon" :icon="item.raw.icon" size="18" />
                      </VAvatar>
                    </template>
                  </VListItem>
                </template>
              </AppSelect>
            </VCol>

            <!-- Grade Field -->
            <VCol cols="12">
              <AppSelect v-model="formData.grade_id" :items="grades" item-title="name" item-value="id"
                label="Grade" placeholder="Select a grade" :rules="gradeRules"
                :error-messages="errors.grade_id" :loading="loadingGrades" required>
                <template #item="{ props: itemProps, item }">
                  <VListItem v-bind="itemProps">
                    <template #prepend>
                      <VAvatar color="info" size="32">
                        <VIcon icon="tabler-school" size="18" />
                      </VAvatar>
                    </template>
                    <template #append v-if="item.raw.min_age && item.raw.max_age">
                      <VChip size="x-small" variant="tonal">
                        {{ item.raw.min_age }}-{{ item.raw.max_age }} yrs
                      </VChip>
                    </template>
                  </VListItem>
                </template>
              </AppSelect>
            </VCol>

            <!-- Preview Section -->
            <VCol cols="12">
              <VAlert type="info" variant="tonal" density="compact">
                <template #prepend>
                  <VIcon icon="tabler-info-circle" />
                </template>
                <div>
                  <p class="text-body-2 mb-1">
                    <strong>Name:</strong> {{ previewName }}
                  </p>
                  <p class="text-body-2 mb-0">
                    <strong>Code:</strong> {{ previewCode }}
                  </p>
                </div>
              </VAlert>
            </VCol>

            <!-- Description Field -->
            <VCol cols="12">
              <AppTextarea v-model="formData.description" label="Description" placeholder="Enter category description"
                rows="3" :error-messages="errors.description" />
            </VCol>

            <!-- Order Field -->
            <VCol cols="12">
              <AppTextField v-model.number="formData.order" label="Display Order" placeholder="Enter display order"
                type="number" :error-messages="errors.order" />
            </VCol>

            <!-- Status Field -->
            <VCol cols="12">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <label class="text-body-1 font-weight-medium">Status</label>
                  <p class="text-caption text-disabled mb-0">
                    Set category status
                  </p>
                </div>
                <VSwitch v-model="formData.is_active" :true-value="1" :false-value="0" color="success" hide-details>
                  <template #label>
                    <span :class="formData.is_active === 1 ? 'text-success' : 'text-error'">
                      {{ formData.is_active === 1 ? 'Active' : 'Inactive' }}
                    </span>
                  </template>
                </VSwitch>
              </div>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>

      <VDivider />

      <VCardActions>
        <VSpacer />
        <VBtn color="secondary" variant="outlined" @click="closeDialog">
          Cancel
        </VBtn>
        <VBtn color="primary" :loading="loading" @click="handleSubmit">
          {{ submitButtonText }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
