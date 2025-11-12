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
  subject: {
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
  icon: '',
  color: '',
  order: 0,
  is_active: 1,
})

// Icon options
const iconOptions = [
  { title: 'Book', value: 'tabler-book', icon: 'tabler-book' },
  { title: 'Math', value: 'tabler-math', icon: 'tabler-math' },
  { title: 'Language', value: 'tabler-language', icon: 'tabler-language' },
  { title: 'Science', value: 'tabler-flask', icon: 'tabler-flask' },
  { title: 'Art', value: 'tabler-palette', icon: 'tabler-palette' },
  { title: 'Music', value: 'tabler-music', icon: 'tabler-music' },
  { title: 'Sports', value: 'tabler-ball-basketball', icon: 'tabler-ball-basketball' },
  { title: 'Computer', value: 'tabler-device-laptop', icon: 'tabler-device-laptop' },
]

// Color options
const colorOptions = [
  { title: 'Primary', value: 'primary', color: 'primary' },
  { title: 'Secondary', value: 'secondary', color: 'secondary' },
  { title: 'Success', value: 'success', color: 'success' },
  { title: 'Info', value: 'info', color: 'info' },
  { title: 'Warning', value: 'warning', color: 'warning' },
  { title: 'Error', value: 'error', color: 'error' },
]

// Validation rules
const nameRules = [requiredValidator]
const codeRules = [requiredValidator]

// Computed
const dialogTitle = computed(() => {
  return props.mode === 'add' ? 'Add New Subject' : 'Edit Subject'
})

const submitButtonText = computed(() => {
  return props.mode === 'add' ? 'Create Subject' : 'Update Subject'
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
    icon: '',
    color: '',
    order: 0,
    is_active: 1,
  }
  clearErrors()
  formRef.value?.reset()
}

const initializeForm = () => {
  if (props.mode === 'edit' && props.subject) {
    formData.value = {
      name: props.subject.name || '',
      code: props.subject.code || '',
      description: props.subject.description || '',
      icon: props.subject.icon || '',
      color: props.subject.color || '',
      order: props.subject.order || 0,
      is_active: props.subject.is_active !== undefined ? props.subject.is_active : 1,
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
    ApiService.post('/subjects', payload,
      (data) => {
        emit('submit')
        closeDialog()
        loading.value = false
      },
      handleError
    )
  } else {
    payload.id = props.subject.id
    ApiService.patch(`/subjects/${props.subject.id}`, payload,
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
              <AppTextField v-model="formData.name" label="Subject Name" placeholder="Enter subject name"
                :rules="nameRules" :error-messages="errors.name" required />
            </VCol>

            <!-- Code Field -->
            <VCol cols="12">
              <AppTextField v-model="formData.code" label="Subject Code" placeholder="Enter subject code (e.g., MATH)"
                :rules="codeRules" :error-messages="errors.code" required />
            </VCol>

            <!-- Description Field -->
            <VCol cols="12">
              <AppTextarea v-model="formData.description" label="Description" placeholder="Enter subject description"
                rows="3" :error-messages="errors.description" />
            </VCol>

            <!-- Icon Field -->
            <VCol cols="12" md="6">
              <AppSelect v-model="formData.icon" :items="iconOptions" item-title="title" item-value="value"
                label="Icon" placeholder="Select an icon" clearable :error-messages="errors.icon">
                <template #selection="{ item }">
                  <div class="d-flex align-center gap-2">
                    <VIcon :icon="item.raw.icon" size="20" />
                    <span>{{ item.raw.title }}</span>
                  </div>
                </template>
                <template #item="{ props: itemProps, item }">
                  <VListItem v-bind="itemProps">
                    <template #prepend>
                      <VIcon :icon="item.raw.icon" size="20" />
                    </template>
                  </VListItem>
                </template>
              </AppSelect>
            </VCol>

            <!-- Color Field -->
            <VCol cols="12" md="6">
              <AppSelect v-model="formData.color" :items="colorOptions" item-title="title" item-value="value"
                label="Color" placeholder="Select a color" clearable :error-messages="errors.color">
                <template #selection="{ item }">
                  <div class="d-flex align-center gap-2">
                    <VAvatar :color="item.raw.color" size="20" />
                    <span>{{ item.raw.title }}</span>
                  </div>
                </template>
                <template #item="{ props: itemProps, item }">
                  <VListItem v-bind="itemProps">
                    <template #prepend>
                      <VAvatar :color="item.raw.color" size="20" />
                    </template>
                  </VListItem>
                </template>
              </AppSelect>
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
                    Set subject status
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
