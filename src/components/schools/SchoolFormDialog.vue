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
  item: {
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
const { encryptIt } = useCrypto()

const formData = ref({
  name: '',
  code: '',
  type: 'PRIVATE',
  address: '',
  city: '',
  state: '',
  country: 'India',
  postal_code: '',
  phone: '',
  email: '',
  website: '',
  student_capacity: null,
  established_date: '',
  is_active: 1,
})

const typeOptions = [
  { title: 'Private', value: 'PRIVATE' },
  { title: 'Public', value: 'PUBLIC' },
  { title: 'Government', value: 'GOVERNMENT' },
]

const statusOptions = [
  { title: 'Active', value: 1 },
  { title: 'Inactive', value: 0 },
]

// Computed
const dialogTitle = computed(() => {
  return props.mode === 'add' ? 'Add New School' : 'Edit School'
})

const submitButtonText = computed(() => {
  return props.mode === 'add' ? 'Create' : 'Update'
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
    type: 'PRIVATE',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postal_code: '',
    phone: '',
    email: '',
    website: '',
    student_capacity: null,
    established_date: '',
    is_active: 1,
  }
  clearErrors()
  formRef.value?.reset()
}

const initializeForm = () => {
  if (props.mode === 'edit' && props.item) {
    formData.value = {
      name: props.item.name || '',
      code: props.item.code || '',
      type: props.item.type || 'PRIVATE',
      address: props.item.address || '',
      city: props.item.city || '',
      state: props.item.state || '',
      country: props.item.country || 'India',
      postal_code: props.item.postal_code || '',
      phone: props.item.phone ? String(props.item.phone) : '',
      email: props.item.email || '',
      website: props.item.website || '',
      student_capacity: props.item.student_capacity || null,
      established_date: props.item.established_date || '',
      is_active: props.item.is_active !== undefined ? props.item.is_active : 1,
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
    // POST - Create
    ApiService.post('/schools', payload,
      (data) => {
        emit('submit')
        closeDialog()
        loading.value = false
      },
      handleError
    )
  } else {
    // PATCH - Update
    ApiService.patch(`/schools/${encryptIt(String(props.item.id))}`, payload,
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
  <VDialog :model-value="isOpen" max-width="800" persistent @update:model-value="closeDialog">
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <span class="text-h5">{{ dialogTitle }}</span>
        <VBtn icon variant="text" size="small" @click="closeDialog">
          <VIcon icon="tabler-x" />
        </VBtn>
      </VCardTitle>

      <VDivider />

      <VCardText>
        <VForm ref="formRef" v-model="formValid" @submit.prevent="handleSubmit">
          <VRow>
            <!-- Basic Information Section -->
            <VCol cols="12">
              <h6 class="text-h6 mb-2">Basic Information</h6>
            </VCol>

            <!-- Name Field -->
            <VCol cols="12" md="6">
              <AppTextField
                v-model="formData.name"
                label="School Name"
                placeholder="Enter school name"
                :rules="[requiredValidator]"
                :error-messages="errors.name"
                required
              />
            </VCol>

            <!-- Code Field -->
            <VCol cols="12" md="6">
              <AppTextField
                v-model="formData.code"
                label="School Code"
                placeholder="e.g., SCH001"
                :rules="[requiredValidator]"
                :error-messages="errors.code"
                required
              />
            </VCol>

            <!-- Type Dropdown -->
            <VCol cols="12" md="6">
              <AppSelect
                v-model="formData.type"
                label="School Type"
                :items="typeOptions"
                item-title="title"
                item-value="value"
                :rules="[requiredValidator]"
                :error-messages="errors.type"
                required
              />
            </VCol>

            <!-- Student Capacity -->
            <VCol cols="12" md="6">
              <AppTextField
                v-model="formData.student_capacity"
                label="Student Capacity"
                type="number"
                placeholder="Enter capacity"
                :error-messages="errors.student_capacity"
              />
            </VCol>

            <!-- Established Date -->
            <VCol cols="12" md="6">
              <AppTextField
                v-model="formData.established_date"
                label="Established Date"
                type="date"
                :error-messages="errors.established_date"
              />
            </VCol>

            <!-- Address Section -->
            <VCol cols="12">
              <h6 class="text-h6 mb-2 mt-4">Address Information</h6>
            </VCol>

            <!-- Address Field -->
            <VCol cols="12">
              <AppTextarea
                v-model="formData.address"
                label="Address"
                placeholder="Enter full address"
                rows="2"
                :error-messages="errors.address"
              />
            </VCol>

            <!-- City -->
            <VCol cols="12" md="4">
              <AppTextField
                v-model="formData.city"
                label="City"
                placeholder="Enter city"
                :error-messages="errors.city"
              />
            </VCol>

            <!-- State -->
            <VCol cols="12" md="4">
              <AppTextField
                v-model="formData.state"
                label="State"
                placeholder="Enter state"
                :error-messages="errors.state"
              />
            </VCol>

            <!-- Postal Code -->
            <VCol cols="12" md="4">
              <AppTextField
                v-model="formData.postal_code"
                label="Postal Code"
                placeholder="Enter postal code"
                :error-messages="errors.postal_code"
              />
            </VCol>

            <!-- Country -->
            <VCol cols="12" md="6">
              <AppTextField
                v-model="formData.country"
                label="Country"
                placeholder="Enter country"
                :error-messages="errors.country"
              />
            </VCol>

            <!-- Contact Section -->
            <VCol cols="12">
              <h6 class="text-h6 mb-2 mt-4">Contact Information</h6>
            </VCol>

            <!-- Email Field -->
            <VCol cols="12" md="6">
              <AppTextField
                v-model="formData.email"
                label="Email"
                type="email"
                placeholder="school@example.com"
                :rules="[emailValidator]"
                :error-messages="errors.email"
              />
            </VCol>

            <!-- Phone Field -->
            <VCol cols="12" md="6">
              <AppTextField
                v-model="formData.phone"
                label="Phone Number"
                placeholder="Enter phone number"
                :error-messages="errors.phone"
              />
            </VCol>

            <!-- Website Field -->
            <VCol cols="12" md="6">
              <AppTextField
                v-model="formData.website"
                label="Website"
                placeholder="https://example.com"
                :error-messages="errors.website"
              />
            </VCol>

            <!-- Status Switch -->
            <VCol cols="12">
              <VDivider class="my-4" />
              <div class="d-flex align-center justify-space-between">
                <div>
                  <label class="text-body-1 font-weight-medium">Status</label>
                  <p class="text-caption text-disabled mb-0">
                    Set school status as active or inactive
                  </p>
                </div>
                <VSwitch
                  v-model="formData.is_active"
                  :true-value="1"
                  :false-value="0"
                  color="success"
                  hide-details>
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
