<script setup>
import { useFormErrors } from '@/composables/useFormErrors'
import ApiService from '@/services/api.service'
import { useRouter, useRoute } from 'vue-router'
import { useApi } from '@/composables/useApi'
import { onMounted } from 'vue'

definePage({
  meta: {
    title: 'School Form',
  },
})

const router = useRouter()
const route = useRoute()
const { encryptIt } = useCrypto()

// State
const loading = ref(false)
const loadingData = ref(false)
const formValid = ref(false)
const formRef = ref(null)
const { errors, setErrors, clearErrors } = useFormErrors(formRef)

// Check if we're in edit mode
const schoolId = computed(() => route.params.id)
const isEditMode = computed(() => !!schoolId.value)
const pageTitle = computed(() => isEditMode.value ? 'Edit School' : 'Create New School')
const pageSubtitle = computed(() => isEditMode.value ? 'Update school information' : 'Add a new school to the system')
const submitButtonText = computed(() => isEditMode.value ? 'Update School' : 'Create School')

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

// Methods
const goBack = () => {
  router.push({ name: 'schools' })
}

const fetchSchoolData = async () => {
  if (!isEditMode.value) return

  loadingData.value = true
  try {
    const encryptedId = encryptIt(String(schoolId.value))
    const { data, error } = await useApi(`/schools/${encryptedId}`).json()

    if (!error.value && data.value) {
      const school = data.value.data || data.value
      formData.value = {
        name: school.name || '',
        code: school.code || '',
        type: school.type || 'PRIVATE',
        address: school.address || '',
        city: school.city || '',
        state: school.state || '',
        country: school.country || 'India',
        postal_code: school.postal_code || '',
        phone: school.phone ? String(school.phone) : '',
        email: school.email || '',
        website: school.website || '',
        student_capacity: school.student_capacity || null,
        established_date: school.established_date || '',
        is_active: school.is_active !== undefined ? school.is_active : 1,
      }
    }
  } catch (err) {
    console.error('Error fetching school data:', err)
  } finally {
    loadingData.value = false
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

  const handleSuccess = (data) => {
    router.push({ name: 'schools' })
    loading.value = false
  }

  if (isEditMode.value) {
    // Update existing school
    const encryptedId = encryptIt(String(schoolId.value))
    ApiService.patch(`/schools/${encryptedId}`, payload, handleSuccess, handleError)
  } else {
    // Create new school
    ApiService.post('/schools', payload, handleSuccess, handleError)
  }
}

// Initialization
onMounted(() => {
  if (isEditMode.value) {
    fetchSchoolData()
  }
})
</script>

<template>
  <div>
    <!-- PAGE HEADER -->
    <div class="mb-6">
      <div class="d-flex align-center mb-2">
        <VBtn icon variant="text" size="small" @click="goBack" class="me-2">
          <VIcon icon="tabler-arrow-left" />
        </VBtn>
        <div>
          <h2 class="text-h4 mb-1">{{ pageTitle }}</h2>
          <p class="text-body-1 text-medium-emphasis mb-0">
            {{ pageSubtitle }}
          </p>
        </div>
      </div>
    </div>

    <!-- LOADING STATE -->
    <div v-if="loadingData" class="text-center py-12">
      <VProgressCircular indeterminate color="primary" size="64" />
      <p class="text-h6 text-medium-emphasis mt-4">Loading school data...</p>
    </div>

    <!-- FORM CARD -->
    <VCard v-else>
      <VCardText>
        <!-- Info Alert -->
        <VAlert
          v-if="!isEditMode"
          type="info"
          variant="tonal"
          class="mb-6"
          icon="tabler-info-circle"
        >
          <div class="d-flex flex-column">
            <span class="font-weight-medium">School Admin Account</span>
            <span class="text-caption">
              A School Admin account will be automatically created using the contact email.
              Login credentials (Email & Password: <strong>123456</strong>) will be sent to the provided email address.
            </span>
          </div>
        </VAlert>

        <VForm ref="formRef" v-model="formValid" @submit.prevent="handleSubmit">
          <VRow>
            <!-- Basic Information Section -->
            <VCol cols="12">
              <h6 class="text-h6 mb-4">Basic Information</h6>
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

            <VCol cols="12">
              <VDivider class="my-4" />
            </VCol>

            <!-- Address Section -->
            <VCol cols="12">
              <h6 class="text-h6 mb-4">Address Information</h6>
            </VCol>

            <!-- Address Field -->
            <VCol cols="12">
              <AppTextarea
                v-model="formData.address"
                label="Address"
                placeholder="Enter full address"
                rows="3"
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

            <VCol cols="12">
              <VDivider class="my-4" />
            </VCol>

            <!-- Contact Section -->
            <VCol cols="12">
              <h6 class="text-h6 mb-4">Contact Information</h6>
            </VCol>

            <!-- Email Field -->
            <VCol cols="12" md="6">
              <AppTextField
                v-model="formData.email"
                label="Email (School Admin Login)"
                type="email"
                placeholder="school@example.com"
                :rules="[requiredValidator, emailValidator]"
                :error-messages="errors.email"
                required
              />
              <p class="text-caption text-disabled mt-1">
                This email will be used for school admin login
              </p>
            </VCol>

            <!-- Phone Field -->
            <VCol cols="12" md="6">
              <AppTextField
                v-model="formData.phone"
                label="Phone Number"
                placeholder="Enter phone number"
                :rules="[requiredValidator]"
                :error-messages="errors.phone"
                required
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

            <VCol cols="12">
              <VDivider class="my-4" />
            </VCol>

            <!-- Status Switch -->
            <VCol cols="12">
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

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn color="secondary" variant="outlined" @click="goBack" :disabled="loading">
          Cancel
        </VBtn>
        <VBtn color="primary" :loading="loading" @click="handleSubmit">
          {{ submitButtonText }}
        </VBtn>
      </VCardActions>
    </VCard>
  </div>
</template>
