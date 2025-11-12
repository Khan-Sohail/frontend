<script setup>
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
  grade: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:isOpen', 'submit'])

// State
const loading = ref(false)
const formValid = ref(false)
const formRef = ref(null)
const { errors, setErrors, clearErrors } = useFormErrors(formRef)

const formData = ref({
  name: '',
  code: '',
  description: '',
  min_age: null,
  max_age: null,
  grade_level: null,
  order: 0,
  is_active: 1,
})

// Validation rules
const nameRules = [requiredValidator]
const codeRules = [requiredValidator]

// Computed
const dialogTitle = computed(() => {
  return props.mode === 'add' ? 'Add New Grade' : 'Edit Grade'
})

const submitButtonText = computed(() => {
  return props.mode === 'add' ? 'Create Grade' : 'Update Grade'
})

// Methods
const closeDialog = () => {
  emit('update:isOpen', false)
  resetForm()
}

const resetForm = () => {
  formData.value = {
    name: '',
    code: '',
    description: '',
    min_age: null,
    max_age: null,
    grade_level: null,
    order: 0,
    is_active: 1,
  }
  clearErrors()
  formRef.value?.reset()
}

const initializeForm = () => {
  if (props.mode === 'edit' && props.grade) {
    formData.value = {
      name: props.grade.name || '',
      code: props.grade.code || '',
      description: props.grade.description || '',
      min_age: props.grade.min_age || null,
      max_age: props.grade.max_age || null,
      grade_level: props.grade.grade_level || null,
      order: props.grade.order || 0,
      is_active: props.grade.is_active !== undefined ? props.grade.is_active : 1,
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
    ApiService.post('/grades', payload,
      (data) => {
        emit('submit')
        closeDialog()
        loading.value = false
      },
      handleError
    )
  } else {
    payload.id = props.grade.id
    ApiService.patch(`/grades/${props.grade.id}`, payload,
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
            <!-- Name Field -->
            <VCol cols="12">
              <AppTextField v-model="formData.name" label="Grade Name" placeholder="Enter grade name (e.g., Grade 1)"
                :rules="nameRules" :error-messages="errors.name" required />
            </VCol>

            <!-- Code Field -->
            <VCol cols="12">
              <AppTextField v-model="formData.code" label="Grade Code" placeholder="Enter grade code (e.g., G1)"
                :rules="codeRules" :error-messages="errors.code" required />
            </VCol>

            <!-- Description Field -->
            <VCol cols="12">
              <AppTextarea v-model="formData.description" label="Description" placeholder="Enter grade description"
                rows="3" :error-messages="errors.description" />
            </VCol>

            <!-- Age Range Fields -->
            <VCol cols="12" md="6">
              <AppTextField v-model.number="formData.min_age" label="Minimum Age" placeholder="Enter minimum age"
                type="number" :error-messages="errors.min_age" />
            </VCol>

            <VCol cols="12" md="6">
              <AppTextField v-model.number="formData.max_age" label="Maximum Age" placeholder="Enter maximum age"
                type="number" :error-messages="errors.max_age" />
            </VCol>

            <!-- Grade Level Field -->
            <VCol cols="12">
              <AppTextField v-model.number="formData.grade_level" label="Grade Level" placeholder="Enter grade level (1-12)"
                type="number" :error-messages="errors.grade_level" />
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
                    Set grade status
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
