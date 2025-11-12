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
  userOptions: {
    type: Array,
    default: () => [],
  },
  pointOptions: {
    type: Array,
    default: () => [],
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
  user_id: null,
  point_id: null,
  points_earned: 0,
  action_date: '',
  description: '',
  is_active: 1,
})

const statusOptions = [
  { title: 'Active', value: 1 },
  { title: 'Inactive', value: 0 },
]

// Computed
const dialogTitle = computed(() => {
  return props.mode === 'add' ? 'Award User Points' : 'Edit User Points'
})

const submitButtonText = computed(() => {
  return props.mode === 'add' ? 'Create' : 'Update'
})

const userSelectOptions = computed(() => {
  return props.userOptions.map(user => ({
    title: `${user.first_name} ${user.last_name} (${user.email})`,
    value: user.id,
  }))
})

const pointSelectOptions = computed(() => {
  return props.pointOptions.map(point => ({
    title: `${point.action_type} (${point.points_value >= 0 ? '+' : ''}${point.points_value} pts)`,
    value: point.id,
    points_value: point.points_value,
  }))
})

// Methods
const closeDialog = () => {
  emit('update:isOpen', false)
  resetForm()
}

const resetForm = () => {
  formData.value = {
    user_id: null,
    point_id: null,
    points_earned: 0,
    action_date: '',
    description: '',
    is_active: 1,
  }
  clearErrors()
  formRef.value?.reset()
}

const initializeForm = () => {
  if (props.mode === 'edit' && props.item) {
    formData.value = {
      user_id: props.item.user_id || null,
      point_id: props.item.point_id || null,
      points_earned: props.item.points_earned !== undefined ? Number(props.item.points_earned) : 0,
      action_date: props.item.action_date || '',
      description: props.item.description || '',
      is_active: props.item.is_active !== undefined ? props.item.is_active : 1,
    }
  } else {
    resetForm()
  }
}

const handlePointChange = (pointId) => {
  const selectedPoint = props.pointOptions.find(p => p.id === pointId)
  if (selectedPoint) {
    formData.value.points_earned = selectedPoint.points_value
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
    ApiService.post('/user_points', payload,
      (data) => {
        emit('submit')
        closeDialog()
        loading.value = false
      },
      handleError
    )
  } else {
    // PATCH - Update
    ApiService.patch(`/user_points/${encryptIt(String(props.item.id))}`, payload,
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

watch(() => formData.value.point_id, (newVal) => {
  if (newVal && props.mode === 'add') {
    handlePointChange(newVal)
  }
})
</script>

<template>
  <VDialog :model-value="isOpen" max-width="600" persistent @update:model-value="closeDialog">
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
            <!-- User Dropdown -->
            <VCol cols="12">
              <AppSelect
                v-model="formData.user_id"
                label="User"
                :items="userSelectOptions"
                item-title="title"
                item-value="value"
                :rules="[requiredValidator]"
                :error-messages="errors.user_id"
                placeholder="Select user"
                required
              />
            </VCol>

            <!-- Point Rule Dropdown -->
            <VCol cols="12">
              <AppSelect
                v-model="formData.point_id"
                label="Point Rule"
                :items="pointSelectOptions"
                item-title="title"
                item-value="value"
                :rules="[requiredValidator]"
                :error-messages="errors.point_id"
                placeholder="Select point rule"
                required
              />
            </VCol>

            <!-- Points Earned Field -->
            <VCol cols="12" md="6">
              <AppTextField
                v-model="formData.points_earned"
                label="Points Earned"
                type="number"
                placeholder="Enter points earned"
                :rules="[requiredValidator]"
                :error-messages="errors.points_earned"
                required
              />
            </VCol>

            <!-- Action Date Field -->
            <VCol cols="12" md="6">
              <AppDateTimePicker
                v-model="formData.action_date"
                label="Action Date"
                placeholder="Select date"
                :error-messages="errors.action_date"
              />
            </VCol>

            <!-- Description Field -->
            <VCol cols="12">
              <AppTextarea
                v-model="formData.description"
                label="Description"
                placeholder="Enter description (optional)"
                rows="3"
                :error-messages="errors.description"
              />
            </VCol>

            <!-- Status Switch -->
            <VCol cols="12">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <label class="text-body-1 font-weight-medium">Status</label>
                  <p class="text-caption text-disabled mb-0">
                    Set record status
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
