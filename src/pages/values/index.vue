<script setup>
import { useApi } from '@/composables/useApi'
import { usePermission } from '@/composables/usePermission'
import ApiService from '@/services/api.service'
import { onMounted } from 'vue'

const { can } = usePermission()

definePage({
  meta: {
    title: 'Values',
  },
})

// State
const isLoading = ref(false)
const isSaving = ref(false)
const saveDialog = ref(false)
const createFormDialog = ref(false)
const editFormDialog = ref(false)

// Values (Left side)
const values = ref([])
const count = ref(0)
const selectedRow = ref(null)
const selectedValueId = ref(null)
const selectedValueName = ref('')

// Value Lists (Right side)
const valueLists = ref([])

// Forms
const createForm = ref({
  name: '',
})

const editForm = ref({
  id: null,
  name: '',
})

const errors = ref({
  name: '',
})

// Fetch all values
const getData = async () => {
  isLoading.value = true
  try {
    const { data, error } = await useApi('/values').json()
    if (!error.value && data.value) {
      values.value = data.value.data || []
      count.value = data.value.count || values.value.length
    }
  } catch (err) {
    console.error('Error fetching values:', err)
  } finally {
    isLoading.value = false
  }
}

// Create new value
const saveValue = async () => {
  try {
    isLoading.value = true
    errors.value = {}

    ApiService.post('/values', createForm.value,
      (data) => {
        isLoading.value = false
        createFormDialog.value = false
        createForm.value = { name: '' }
        getData()
      },
      (error) => {
        if (error?.data?.errors) {
          errors.value = error.data.errors
        }
        isLoading.value = false
      }
    )
  } catch (e) {
    isLoading.value = false
  }
}

// Get value for editing
const getValue = async (valueId) => {
  editForm.value = {}
  isLoading.value = true
  try {
    const { data, error } = await useApi(`/values/${valueId}`).json()
    if (!error.value && data.value) {
      editForm.value = { ...data.value.data }
      editFormDialog.value = true
    }
  } catch (err) {
    console.error('Error fetching value:', err)
  } finally {
    isLoading.value = false
  }
}

// Update value
const updateValue = async (valueId) => {
  try {
    isLoading.value = true
    errors.value = {}

    ApiService.patch(`/values/${valueId}`, editForm.value,
      (data) => {
        isLoading.value = false
        editFormDialog.value = false
        getData()

        // Refresh value lists if this value is selected
        if (selectedValueId.value === valueId) {
          getValueListData(valueId, selectedRow.value)
        }
      },
      (error) => {
        if (error?.data?.errors) {
          errors.value = error.data.errors
        }
        isLoading.value = false
      }
    )
  } catch (e) {
    isLoading.value = false
  }
}

// Delete value
const deleteValue = async (valueId, index) => {
  if (!confirm('Are you sure you want to delete this value?')) return

  isLoading.value = true
  ApiService.delete(`/values/${valueId}`,
    () => {
      isLoading.value = false

      // Clear selection if deleted value was selected
      if (selectedValueId.value === valueId) {
        selectedValueId.value = null
        selectedValueName.value = ''
        valueLists.value = []
        selectedRow.value = null
      }

      getData()
    },
    (error) => {
      console.error('Error deleting value:', error)
      isLoading.value = false
    }
  )
}

// Get value lists for a value
const getValueListData = async (valueId, index) => {
  if (selectedRow.value === index) {
    // Toggle: close if already selected
    selectedRow.value = null
    selectedValueId.value = null
    selectedValueName.value = ''
    valueLists.value = []
    return
  }

  selectedRow.value = index
  selectedValueId.value = valueId

  try {
    const { data, error } = await useApi(`/values/${valueId}/value_lists`).json()
    if (!error.value && data.value) {
      valueLists.value = data.value.data || []
      const selectedValue = values.value.find(v => v.id === valueId)
      selectedValueName.value = selectedValue ? selectedValue.name : ''
    }
  } catch (err) {
    console.error('Error fetching value lists:', err)
  }
}

// Add empty row to value lists
const addEmptyValueList = () => {
  valueLists.value.push({
    value_id: selectedValueId.value,
    description: '',
    code: '',
    is_active: 1,
  })
}

// Save value lists (bulk)
const saveValueLists = async () => {
  if (valueLists.value.length === 0) return

  // Validation
  const hasErrors = valueLists.value.some(vl => !vl.description || !vl.code)
  if (hasErrors) {
    alert('Please fill in all Description and Code fields')
    return
  }

  isSaving.value = true

  try {
    const payload = {
      datas: valueLists.value.map(vl => ({
        id: vl.id || undefined,
        value_id: vl.value_id,
        description: vl.description.toUpperCase(),
        code: vl.code.toUpperCase(),
        is_active: vl.is_active,
      }))
    }

    ApiService.post(`/values/${selectedValueId.value}/multiple_value_lists`, payload,
      (data) => {
        valueLists.value = data.data || []
        saveDialog.value = true
        setTimeout(() => {
          saveDialog.value = false
        }, 2500)
        isSaving.value = false
      },
      (error) => {
        console.error('Error saving value lists:', error)
        isSaving.value = false
      }
    )
  } catch (error) {
    console.error(error)
    isSaving.value = false
  }
}

// Delete value list
const deleteValueList = async (id) => {
  if (!confirm('Are you sure you want to delete this data?')) return

  isLoading.value = true
  ApiService.delete(`/values/${selectedValueId.value}/value_lists/${id}`,
    () => {
      isLoading.value = false
      getValueListData(selectedValueId.value, selectedRow.value)
    },
    (error) => {
      console.error('Error deleting value list:', error)
      isLoading.value = false
    }
  )
}

// Auto-uppercase for description
const handleDescriptionInput = (index) => {
  if (valueLists.value[index]?.description) {
    valueLists.value[index].description = valueLists.value[index].description.toUpperCase()
  }
}

// Auto-uppercase for code
const handleCodeInput = (index) => {
  if (valueLists.value[index]?.code) {
    valueLists.value[index].code = valueLists.value[index].code.toUpperCase()
  }
}

// Initialize
onMounted(() => {
  getData()
})
</script>

<template>
  <div>
    <VRow>
      <!-- Left Side: Values List -->
      <VCol xl="5" lg="5" md="5" sm="12" cols="12">
        <VCard class="overflow-y-auto" elevation="6" :max-height="$vuetify.display.smAndDown ? 'auto' : '600'">
          <VCardTitle class="d-flex align-center justify-space-between">
            <span>Total Values ({{ count }})</span>
            <VBtn v-if="can('VALUES.CREATE')" color="primary" size="small" @click="createFormDialog = true">
              + Add Value
            </VBtn>
          </VCardTitle>

          <VProgressLinear v-if="isLoading" indeterminate color="primary" />

          <VTable fixed-header class="mx-2">
            <thead>
              <tr>
                <th class="text-start font-weight-bold">Sr No</th>
                <th class="text-start font-weight-bold">Name</th>
                <th class="text-center font-weight-bold" style="min-inline-size: 130px;">Action</th>
              </tr>
            </thead>
            <tbody v-if="values.length > 0">
              <tr v-for="(value, i) in values" :key="`value${i}`">
                <td style="min-inline-size: 85px;">&nbsp;{{ i + 1 }}</td>
                <td>{{ value.name }}</td>
                <td class="text-right">
                  <VBtn v-if="can('VALUES.UPDATE')" size="x-small" icon elevation="0" color="primary" @click="getValue(value.id)">
                    <VIcon size="15">tabler-edit</VIcon>
                  </VBtn>
                  <VBtn class="mx-2" size="x-small" icon elevation="0"
                    :color="selectedRow !== i ? 'primary' : 'success'" @click="getValueListData(value.id, i)">
                    <VIcon v-if="selectedRow !== i" size="15">tabler-plus</VIcon>
                    <VIcon v-else size="15">tabler-x</VIcon>
                  </VBtn>
                  <VBtn v-if="can('VALUES.DELETE')" size="x-small" icon elevation="0" color="error" @click="deleteValue(value.id, i)">
                    <VIcon size="15">tabler-trash</VIcon>
                  </VBtn>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="3" class="text-center">No data found</td>
              </tr>
            </tbody>
          </VTable>
        </VCard>
      </VCol>

      <!-- Right Side: Value Lists -->
      <VCol xl="7" lg="7" md="7" sm="12" cols="12">
        <VCard elevation="6">
          <VCardTitle>Value List of: {{ selectedValueName || '' }}</VCardTitle>

          <VTable fixed-header :height="$vuetify.display.smAndDown ? 'auto' : '535'">
            <thead>
              <tr>
                <th v-if="!$vuetify.display.smAndDown" class="text-left">Sr No</th>
                <th class="text-left" style="min-inline-size: 200px;">Description</th>
                <th class="text-left" style="min-inline-size: 200px;">Code</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody v-if="selectedValueId != null">
              <tr v-for="(valueList, i) in valueLists" :key="`valueList${i}`" style="block-size: 70px;">
                <td v-if="!$vuetify.display.smAndDown">{{ i + 1 }}</td>
                <td>
                  <AppTextField v-model="valueList.description" @input="handleDescriptionInput(i)" density="compact"
                    variant="outlined" label="Description"
                    :error-messages="!valueList.description ? 'This description field is required' : ''"
                    hide-details="auto" />
                </td>
                <td>
                  <AppTextField v-model="valueList.code" @input="handleCodeInput(i)" density="compact"
                    variant="outlined" label="Code"
                    :error-messages="!valueList.code ? 'This code field is required' : ''" hide-details="auto" />
                </td>
                <td class="text-right">
                  <VTooltip location="bottom">
                    <template #activator="{ props }">
                      <VBtn v-bind="props" size="small" color="error" icon @click="deleteValueList(valueList.id)">
                        <VIcon>tabler-trash</VIcon>
                      </VBtn>
                    </template>
                    <span>Delete</span>
                  </VTooltip>
                </td>
              </tr>
              <tr v-if="selectedValueId != null">
                <td :colspan="$vuetify.display.smAndDown ? 3 : 4">
                  <VBtn variant="outlined" block color="primary" @click="addEmptyValueList">
                    Add New {{ selectedValueName }}
                  </VBtn>
                </td>
              </tr>
              <tr v-if="selectedValueId != null">
                <td :colspan="$vuetify.display.smAndDown ? 1 : 2"></td>
                <td :colspan="$vuetify.display.smAndDown ? 2 : 2">
                  <VBtn block color="primary" :loading="isSaving" :disabled="isSaving" @click="saveValueLists">
                    Save
                  </VBtn>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td :colspan="$vuetify.display.smAndDown ? 3 : 4" class="text-center">
                  Please Select any value from left
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCard>
      </VCol>
    </VRow>

    <!-- Create Form Dialog -->
    <VDialog v-model="createFormDialog" max-width="390">
      <VCard class="px-1">
        <VCardText>
          <label>Name *</label>
          <AppTextField v-model="createForm.name" @input="createForm.name = createForm.name.toUpperCase()"
            variant="outlined" placeholder="Enter value name *" :error-messages="errors.name" />
          <VBtn :loading="isLoading" color="primary" class="mt-4" :disabled="isLoading" @click="saveValue">
            Save Value
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Edit Form Dialog -->
    <VDialog v-model="editFormDialog" max-width="390">
      <VCard class="px-1">
        <VCardText>
          <label>Name *</label>
          <AppTextField v-model="editForm.name" @input="editForm.name = editForm.name.toUpperCase()" variant="outlined"
            placeholder="Enter value name *" :error-messages="errors.name" />
          <VBtn :loading="isLoading" color="primary" :disabled="isLoading" @click="updateValue(editForm.id)">
            Edit Value
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Success Dialog -->
    <VDialog v-model="saveDialog" width="300">
      <VCard>
        <VCardText class="d-flex flex-column align-center">
          <VIcon size="80" color="success" class="mb-4">tabler-circle-check</VIcon>
          <span class="text-center">
            New Value List Created Successfully
          </span>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
:deep(.v-table) {
  .v-table__wrapper {
    border-radius: 0;
  }
}
</style>
