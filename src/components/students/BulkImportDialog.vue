<script setup>
import { useApi } from '@/composables/useApi'
import ApiService from '@/services/api.service'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:isOpen', 'submit'])

const dialogModel = computed({
  get: () => props.isOpen,
  set: value => emit('update:isOpen', value),
})

// Form State
const selectedFile = ref(null)
const fileInputRef = ref(null)
const uploading = ref(false)
const uploadResult = ref(null)
const errorMessage = ref('')

// File handling
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain']
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      errorMessage.value = 'Please upload a valid CSV file'
      selectedFile.value = null
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      errorMessage.value = 'File size must not exceed 10MB'
      selectedFile.value = null
      return
    }

    selectedFile.value = file
    errorMessage.value = ''
    uploadResult.value = null
  }
}

const handleFileSelect = () => {
  fileInputRef.value?.click()
}

const handleDownloadTemplate = async () => {
  try {
    const response = await ApiService.get('/bulk-import/template/students', {
      responseType: 'blob',
    })

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'student_import_template.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (error) {
    console.error('Error downloading template:', error)
    errorMessage.value = 'Failed to download template'
  }
}

const handleUpload = async () => {
  if (!selectedFile.value) {
    errorMessage.value = 'Please select a file to upload'
    return
  }

  uploading.value = true
  errorMessage.value = ''
  uploadResult.value = null

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    const response = await ApiService.post('/bulk-import/students', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    if (response.data.success) {
      uploadResult.value = response.data.data

      // Auto-navigate to pending imports after 2 seconds
      setTimeout(() => {
        handleClose()
        emit('submit')
        // Navigate to pending imports page
        navigateTo('/students/pending-imports')
      }, 2000)
    } else {
      errorMessage.value = response.data.message || 'Upload failed'
    }
  } catch (error) {
    console.error('Upload error:', error)
    errorMessage.value = error.response?.data?.message || 'An error occurred during upload'
  } finally {
    uploading.value = false
  }
}

const handleClose = () => {
  selectedFile.value = null
  uploadResult.value = null
  errorMessage.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  dialogModel.value = false
}
</script>

<template>
  <VDialog v-model="dialogModel" max-width="600" persistent>
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <span class="text-h5">Bulk Import Students</span>
        <VBtn icon="tabler-x" variant="text" @click="handleClose" :disabled="uploading" />
      </VCardTitle>

      <VDivider />

      <VCardText>
        <!-- Instructions -->
        <VAlert type="info" variant="tonal" class="mb-4">
          <div class="text-body-2">
            <p class="mb-2"><strong>Instructions:</strong></p>
            <ul class="ps-4">
              <li>Download the CSV template below</li>
              <li>Fill in student data (name, email, phone, school_id, gender, dob, address, city, state, pincode)</li>
              <li>Upload the completed CSV file</li>
              <li>Review and approve the imported data</li>
            </ul>
          </div>
        </VAlert>

        <!-- Download Template -->
        <div class="mb-6">
          <VBtn
            variant="outlined"
            color="primary"
            prepend-icon="tabler-download"
            @click="handleDownloadTemplate"
            block
          >
            Download CSV Template
          </VBtn>
        </div>

        <!-- File Upload -->
        <div class="mb-4">
          <input
            ref="fileInputRef"
            type="file"
            accept=".csv,text/csv,application/vnd.ms-excel"
            style="display: none"
            @change="handleFileChange"
          />

          <VBtn
            variant="outlined"
            color="secondary"
            prepend-icon="tabler-upload"
            @click="handleFileSelect"
            :disabled="uploading"
            block
          >
            {{ selectedFile ? 'Change File' : 'Select CSV File' }}
          </VBtn>

          <!-- Selected File Info -->
          <div v-if="selectedFile" class="mt-3">
            <VCard variant="tonal" color="success">
              <VCardText class="d-flex align-center gap-3">
                <VIcon icon="tabler-file-check" size="24" />
                <div class="flex-grow-1">
                  <p class="font-weight-medium mb-0">{{ selectedFile.name }}</p>
                  <small class="text-disabled">{{ (selectedFile.size / 1024).toFixed(2) }} KB</small>
                </div>
              </VCardText>
            </VCard>
          </div>
        </div>

        <!-- Error Message -->
        <VAlert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
          {{ errorMessage }}
        </VAlert>

        <!-- Upload Result -->
        <VAlert v-if="uploadResult" type="success" variant="tonal" class="mb-4">
          <div class="text-body-2">
            <p class="font-weight-medium mb-2">Upload Successful!</p>
            <p class="mb-1">✓ Successfully uploaded: {{ uploadResult.success_count }} students</p>
            <p v-if="uploadResult.error_count > 0" class="mb-1 text-warning">
              ⚠ Rows with errors: {{ uploadResult.error_count }}
            </p>
            <p class="text-caption mb-0">Redirecting to review page...</p>
          </div>
        </VAlert>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn
          variant="outlined"
          color="secondary"
          @click="handleClose"
          :disabled="uploading"
        >
          Cancel
        </VBtn>
        <VBtn
          color="primary"
          @click="handleUpload"
          :loading="uploading"
          :disabled="!selectedFile || uploading"
        >
          Upload & Review
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
