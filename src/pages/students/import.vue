<script setup>
import { useApi } from '@/composables/useApi'
import ApiService from '@/services/api.service'

definePage({
  meta: {
    title: 'Import Students',
  },
})

// Upload State
const selectedFile = ref(null)
const fileInputRef = ref(null)
const uploading = ref(false)
const uploadMessage = ref('')
const uploadType = ref('')

// Pending Imports State
const pendingImports = ref([])
const loading = ref(false)
const selectedImports = ref([])
const processing = ref(false)

// Table headers
const headers = [
  { title: 'ID', key: 'id', sortable: false, width: '80px' },
  { title: 'Name', key: 'name', sortable: false },
  { title: 'Email', key: 'email', sortable: false },
  { title: 'Phone', key: 'phone', sortable: false },
  { title: 'School ID', key: 'school_id', sortable: false },
  { title: 'Gender', key: 'gender', sortable: false },
  { title: 'DOB', key: 'dob', sortable: false },
  { title: 'City', key: 'city', sortable: false },
  { title: 'State', key: 'state', sortable: false },
  { title: 'Errors', key: 'validation_errors', sortable: false },
]

// Drag & Drop State
const isDragging = ref(false)

// File handling
const handleFileChange = (event) => {
  const file = event.target.files[0]
  processFile(file)
}

const processFile = (file) => {
  if (!file) return

  const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain']
  if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
    uploadMessage.value = 'Please upload a valid CSV file'
    uploadType.value = 'error'
    selectedFile.value = null
    return
  }

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    uploadMessage.value = 'File size must not exceed 10MB'
    uploadType.value = 'error'
    selectedFile.value = null
    return
  }

  selectedFile.value = file
  uploadMessage.value = ''
}

const handleFileSelect = () => {
  fileInputRef.value?.click()
}

const handleDeleteFile = () => {
  selectedFile.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// Drag & Drop handlers
const handleDragEnter = (e) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (e) => {
  e.preventDefault()
  isDragging.value = false
}

const handleDragOver = (e) => {
  e.preventDefault()
}

const handleDrop = (e) => {
  e.preventDefault()
  isDragging.value = false

  const files = e.dataTransfer.files
  if (files.length > 0) {
    processFile(files[0])
  }
}

const handleDownloadTemplate = async () => {
  await ApiService.download(
    '/bulk-import/template/students',
    'student_import_template.csv',
    () => {
      // Success - file downloaded
    },
    (error) => {
      uploadMessage.value = 'Failed to download template'
      uploadType.value = 'error'
    }
  )
}

const handleUpload = async () => {
  if (!selectedFile.value) {
    uploadMessage.value = 'Please select a file to upload'
    uploadType.value = 'error'
    return
  }

  uploading.value = true
  uploadMessage.value = ''

  await ApiService.uploadFile(
    '/bulk-import/students',
    selectedFile.value,
    (response) => {
      if (response.success) {
        uploadMessage.value = `Successfully uploaded ${response.data.success_count} students for review`
        uploadType.value = 'success'
        selectedFile.value = null
        if (fileInputRef.value) {
          fileInputRef.value.value = ''
        }
        // Refresh pending imports
        fetchPendingImports()
      } else {
        uploadMessage.value = response.message || 'Upload failed'
        uploadType.value = 'error'
      }
      uploading.value = false
    },
    (error) => {
      uploadMessage.value = error?.data?.message || 'An error occurred during upload'
      uploadType.value = 'error'
      uploading.value = false
    }
  )
}

// Fetch pending imports
const fetchPendingImports = async () => {
  loading.value = true
  try {
    const { data, error } = await useApi('/bulk-import/pending', {
      query: {
        position_id: '', // Will filter by STUDENT position in backend if needed
      }
    }).json()

    if (!error.value && data.value) {
      pendingImports.value = data.value.data.data || []
    }
  } catch (err) {
    console.error('Error fetching pending imports:', err)
  } finally {
    loading.value = false
  }
}

// Approve imports
const handleApprove = async () => {
  if (selectedImports.value.length === 0) {
    uploadMessage.value = 'Please select at least one record to approve'
    uploadType.value = 'warning'
    return
  }

  processing.value = true

  await ApiService.post(
    '/bulk-import/approve',
    { import_ids: selectedImports.value },
    (response) => {
      if (response.success) {
        uploadMessage.value = `Successfully created ${response.data.success_count} students`
        uploadType.value = 'success'
        selectedImports.value = []
        fetchPendingImports()
      } else {
        uploadMessage.value = response.message || 'Approval failed'
        uploadType.value = 'error'
      }
      processing.value = false
    },
    (error) => {
      uploadMessage.value = error?.data?.message || 'An error occurred during approval'
      uploadType.value = 'error'
      processing.value = false
    }
  )
}

// Reject imports
const handleReject = async () => {
  if (selectedImports.value.length === 0) {
    uploadMessage.value = 'Please select at least one record to reject'
    uploadType.value = 'warning'
    return
  }

  processing.value = true

  await ApiService.post(
    '/bulk-import/reject',
    { import_ids: selectedImports.value },
    (response) => {
      if (response.success) {
        uploadMessage.value = `Successfully rejected ${response.data.deleted_count} records`
        uploadType.value = 'success'
        selectedImports.value = []
        fetchPendingImports()
      } else {
        uploadMessage.value = response.message || 'Rejection failed'
        uploadType.value = 'error'
      }
      processing.value = false
    },
    (error) => {
      uploadMessage.value = error?.data?.message || 'An error occurred during rejection'
      uploadType.value = 'error'
      processing.value = false
    }
  )
}

// Initialize
onMounted(() => {
  fetchPendingImports()
})
</script>

<template>
  <div>
    <!-- PAGE HEADER -->
    <div class="mb-6">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h2 class="text-h4 mb-1">Import Students</h2>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Upload CSV file to bulk import student records
          </p>
        </div>
        <VBtn
          variant="text"
          color="secondary"
          prepend-icon="tabler-arrow-left"
          to="/students"
        >
          Back to Students
        </VBtn>
      </div>
    </div>

    <!-- UPLOAD SECTION -->
    <VCard class="mb-6">
      <VCardText class="pa-6">
        <!-- Alert Messages -->
        <VAlert v-if="uploadMessage" :type="uploadType" variant="tonal" class="mb-6" closable @click:close="uploadMessage = ''">
          {{ uploadMessage }}
        </VAlert>

        <!-- Step 1: Download Template -->
        <div class="mb-6">
          <div class="d-flex align-center gap-2 mb-3">
            <VAvatar color="primary" size="32" variant="tonal">
              <span class="text-sm font-weight-bold">1</span>
            </VAvatar>
            <h3 class="text-h6 mb-0">Download Template</h3>
          </div>
          <p class="text-body-2 text-medium-emphasis mb-3 ms-11">
            Start by downloading our CSV template to ensure your data is formatted correctly
          </p>
          <div class="ms-11">
            <VBtn
              variant="outlined"
              color="primary"
              prepend-icon="tabler-download"
              @click="handleDownloadTemplate"
              size="large"
            >
              Download CSV Template
            </VBtn>
          </div>
        </div>

        <VDivider class="my-6" />

        <!-- Step 2: Upload File -->
        <div>
          <div class="d-flex align-center gap-2 mb-3">
            <VAvatar color="success" size="32" variant="tonal">
              <span class="text-sm font-weight-bold">2</span>
            </VAvatar>
            <h3 class="text-h6 mb-0">Upload Your File</h3>
          </div>
          <p class="text-body-2 text-medium-emphasis mb-4 ms-11">
            Fill in the template with student data and upload it here
          </p>

          <div class="ms-11">
            <input
              ref="fileInputRef"
              type="file"
              accept=".csv,text/csv,application/vnd.ms-excel"
              style="display: none"
              @change="handleFileChange"
            />

            <!-- Drag & Drop Area -->
            <div
              v-if="!selectedFile"
              class="upload-dropzone"
              :class="{ 'upload-dropzone--dragging': isDragging }"
              @click="handleFileSelect"
              @dragenter="handleDragEnter"
              @dragleave="handleDragLeave"
              @dragover="handleDragOver"
              @drop="handleDrop"
            >
              <VIcon :icon="isDragging ? 'tabler-file-import' : 'tabler-cloud-upload'" size="64" class="upload-dropzone__icon mb-4" />
              <h4 class="text-h6 mb-2">
                {{ isDragging ? 'Drop your file here' : 'Drag & drop your CSV file here' }}
              </h4>
              <p class="text-body-2 text-medium-emphasis mb-4">or click to browse files</p>
              <VChip variant="tonal" color="primary">
                Supports: CSV (Max 10MB)
              </VChip>
            </div>

            <!-- Selected File Display -->
            <div v-else>
              <VCard class="upload-file-card mb-4">
                <VCardText class="py-4">
                  <div class="d-flex align-center justify-space-between">
                    <div class="d-flex align-center gap-3">
                      <VIcon icon="tabler-file-text" size="32" color="success" />
                      <div>
                        <p class="font-weight-medium mb-0">{{ selectedFile.name }}</p>
                        <p class="text-body-2 text-medium-emphasis mb-0">
                          {{ (selectedFile.size / 1024).toFixed(2) }} KB
                        </p>
                      </div>
                    </div>
                    <VBtn
                      icon="tabler-trash"
                      variant="text"
                      color="error"
                      size="x-small"
                      @click="handleDeleteFile"
                      :disabled="uploading"
                    />
                  </div>

                  <!-- Progress Bar -->
                  <VProgressLinear
                    v-if="uploading"
                    color="success"
                    indeterminate
                    height="4"
                    class="mt-3"
                  />
                </VCardText>
              </VCard>

              <!-- Action Buttons -->
              <div class="d-flex gap-3">
                <VBtn
                  color="success"
                  prepend-icon="tabler-upload"
                  @click="handleUpload"
                  :loading="uploading"
                >
                  Upload & Process
                </VBtn>
                <VBtn
                  variant="outlined"
                  @click="handleDeleteFile"
                  :disabled="uploading"
                >
                  Cancel
                </VBtn>
              </div>
            </div>
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- PENDING IMPORTS TABLE -->
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-2">
          <VIcon icon="tabler-table" />
          <span>Pending Imports ({{ pendingImports.length }})</span>
        </div>

        <div class="d-flex gap-2">
          <VBtn
            v-if="selectedImports.length > 0"
            color="success"
            variant="elevated"
            prepend-icon="tabler-check"
            @click="handleApprove"
            :loading="processing"
          >
            Proceed ({{ selectedImports.length }})
          </VBtn>
          <VBtn
            v-if="selectedImports.length > 0"
            color="error"
            variant="outlined"
            prepend-icon="tabler-x"
            @click="handleReject"
            :loading="processing"
          >
            Delete
          </VBtn>
        </div>
      </VCardTitle>

      <VDivider />

      <VDataTable
        v-model="selectedImports"
        :headers="headers"
        :items="pendingImports"
        :loading="loading"
        item-value="id"
        show-select
        hide-default-footer
        class="data-table"
      >
        <!-- ID Column -->
        <template #item.id="{ item, index }">
          <span class="text-body-2 text-medium-emphasis">#{{ index + 1 }}</span>
        </template>

        <!-- Name Column -->
        <template #item.name="{ item }">
          <div class="d-flex align-center gap-2">
            <VAvatar size="32" color="primary" variant="tonal">
              <span class="text-sm">{{ item.first_name?.charAt(0) }}</span>
            </VAvatar>
            <span class="font-weight-medium">{{ item.first_name }} {{ item.last_name }}</span>
          </div>
        </template>

        <!-- Email Column -->
        <template #item.email="{ item }">
          <span class="text-body-2">{{ item.email }}</span>
        </template>

        <!-- Phone Column -->
        <template #item.phone="{ item }">
          <span class="text-body-2">{{ item.phone || '-' }}</span>
        </template>

        <!-- School ID Column -->
        <template #item.school_id="{ item }">
          <VChip v-if="item.school_id" size="small" variant="tonal" color="info">
            {{ item.school_id }}
          </VChip>
          <span v-else class="text-disabled">-</span>
        </template>

        <!-- Gender Column -->
        <template #item.gender="{ item }">
          <VChip v-if="item.gender" size="small" variant="tonal">
            {{ item.gender }}
          </VChip>
          <span v-else class="text-disabled">-</span>
        </template>

        <!-- DOB Column -->
        <template #item.dob="{ item }">
          <span class="text-body-2">{{ item.dob || '-' }}</span>
        </template>

        <!-- City Column -->
        <template #item.city="{ item }">
          <span class="text-body-2">{{ item.city || '-' }}</span>
        </template>

        <!-- State Column -->
        <template #item.state="{ item }">
          <span class="text-body-2">{{ item.state || '-' }}</span>
        </template>

        <!-- Validation Errors Column -->
        <template #item.validation_errors="{ item }">
          <VChip v-if="item.validation_errors" size="small" variant="tonal" color="error">
            {{ item.validation_errors }}
          </VChip>
          <VChip v-else size="small" variant="tonal" color="success">
            No errors
          </VChip>
        </template>

        <!-- Loading State -->
        <template #loading>
          <VSkeletonLoader type="table-row@10" />
        </template>

        <!-- No Data State -->
        <template #no-data>
          <div class="text-center py-12">
            <VIcon size="64" icon="tabler-database-off" class="mb-4 text-disabled" />
            <p class="text-h6 text-medium-emphasis mb-2">No Pending Imports</p>
            <p class="text-body-2 text-disabled">Upload a CSV file to start importing students</p>
          </div>
        </template>
      </VDataTable>
    </VCard>
  </div>
</template>

<style scoped>
:deep(.data-table) {
  .v-table__wrapper {
    border-radius: 0;
  }

  .v-data-table-header {
    background-color: rgb(var(--v-theme-surface));
  }

  .v-data-table__td,
  .v-data-table__th {
    padding-block: 1rem;
  }
}

.upload-dropzone {
  border: 2px dashed rgb(var(--v-theme-primary));
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.upload-dropzone:hover {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.08);
  transform: translateY(-2px);
}

.upload-dropzone--dragging {
  border-color: rgb(var(--v-theme-success));
  background-color: rgba(var(--v-theme-success), 0.12);
  border-width: 3px;
  transform: scale(1.02);
}

.upload-dropzone__icon {
  color: rgb(var(--v-theme-primary));
  opacity: 0.6;
  transition: all 0.3s ease;
}

.upload-dropzone:hover .upload-dropzone__icon {
  opacity: 1;
  transform: scale(1.1);
}

.upload-dropzone--dragging .upload-dropzone__icon {
  color: rgb(var(--v-theme-success));
  opacity: 1;
  animation: bounce 0.6s ease-in-out infinite;
}

.upload-file-card {
  border: 2px solid rgb(var(--v-theme-success));
  background-color: rgba(var(--v-theme-success), 0.04);
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>
