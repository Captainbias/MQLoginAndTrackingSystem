<template>
  <div>
    <h2>Attendance Records</h2>
    <el-form :model="form" @submit.native.prevent="submitEntry" label-width="120px" style="max-width: 400px;">
      <!-- Names List -->
      <el-form-item label="Names">
        <el-tag
          v-for="(n, index) in form.names"
          :key="index"
          closable
          @close="form.names.splice(index, 1)"
          style="margin-top: 8px;"
        >
          {{ n }}
        </el-tag><!-- fix unaligned-->

        <el-input
          v-model="nameInput"
          placeholder="Type a name and press Enter"
          @keydown.enter.prevent="addName"
          style="width: 100%; margin-top: 8px;"
          list="worker-list"
        >
          <template #append>
            <el-button @click="addName" type="primary" size="small">Add</el-button>
          </template>
        </el-input>

        <datalist id="worker-list">
          <option
            v-for="worker in workers"
            :key="worker"
            :value="worker"
          />
        </datalist>
      </el-form-item>

      <!-- Date -->
      <el-form-item label="Date" required>
      <el-date-picker
        v-model="form.date"
        type="date"
        placeholder="Select date"
        style="width: 100%;"
        :default-value="getTodayDateEST()"
      />
      </el-form-item>

      <!-- Login Time -->
      <el-form-item label="Login Time" required>
        <el-select v-model="form.loginTime" placeholder="Select login time" style="width: 100%;">
          <el-option
            v-for="time in timeOptions"
            :key="time"
            :label="time"
            :value="time"
          />
        </el-select>
      </el-form-item>

      <!-- Logout Time -->
      <el-form-item label="Logout Time" required>
        <el-select v-model="form.logoutTime" placeholder="Select logout time" style="width: 100%;">
          <el-option
            v-for="time in timeOptions"
            :key="time"
            :label="time"
            :value="time"
          />
        </el-select>
      </el-form-item>

      <!-- Submit Button -->
      <el-form-item>
        <el-button type="primary" native-type="submit">Add Entry</el-button>
      </el-form-item>

    </el-form>
    <div v-for="worker in workers" :key="worker" style="margin-bottom: 40px;">
      <h3>{{ worker }} — Unpaid Attendance</h3>
      <el-table
        :data="unpaidByWorker[worker] || []"
        style="width: 100%"
        border
        show-summary
        :summary-method="summaryMethod"
      >
        <el-table-column prop="date" label="Date" width="120" />
        <el-table-column prop="login_time" label="Login Time" width="120" />
        <el-table-column prop="logout_time" label="Logout Time" width="120" />
        <el-table-column prop="hours" label="Hours Worked" width="140" />
        <el-table-column prop="overtime_hours" label="Overtime Hours" width="160" />
        <el-table-column
          prop="paid"
          label="Paid"
          width="100"
          :formatter="row => row.paid ? 'Yes' : 'No'"
        />
        <el-table-column label="Actions" width="160">
          <template #default="{ row }">
            <div style="display: flex; gap: 8px; align-items: center;">
              <el-button type="primary" size="small" @click="openEdit(row)">Edit</el-button>
              <el-button type="danger" size="small" @click="deleteEntry(row.id)">Delete</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Edit Dialog -->
    <el-dialog v-model="editDialogVisible" title="Edit Attendance Entry" width="500px">
      <el-form :model="editForm" label-width="140px">
        <el-form-item label="Date">
          <el-date-picker
            v-model="editForm.date"
            type="date"
            format="YYYY-MM-DD"
            
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item label="Login Time">
          <el-time-picker
            v-model="editForm.login_time"
            format="HH:mm"
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item label="Logout Time">
          <el-time-picker
            v-model="editForm.logout_time"
            format="HH:mm"
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item label="Hours Worked">
          <el-input-number v-model="editForm.hours" :min="0" :step="0.5" style="width: 100%;" />
        </el-form-item>

        <el-form-item label="Overtime Hours">
          <el-input-number v-model="editForm.overtime_hours" :min="0" :step="0.5" style="width: 100%;" />
        </el-form-item>

        <el-form-item label="Paid">
          <el-switch v-model="editForm.paid" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="saveEdit">Save</el-button>
      </template>
    </el-dialog>
  </div>
  <div>
    <h2>Past Records</h2>
  </div>
</template>

<script setup lang="ts">
import { reactive,ref, onMounted,watch } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'

const workers = ref([])
const annualReview = ref({})

const API_BASE = 'http://127.0.0.1:5000'  // <-- Backend base URL

const timeOptions = []
for (let hour = 0; hour < 24; hour++) {
  const h = hour.toString().padStart(2, '0')
  timeOptions.push(`${h}:00`)
  timeOptions.push(`${h}:30`)
}

async function fetchWorkers() {
  try {
    const res = await fetch(`${API_BASE}/workers`)
    if (!res.ok) throw new Error('Network error fetching workers')
    workers.value = await res.json()
    console.log('Workers loaded:', workers.value)
  } catch (error) {
    console.error(error)
  }
}

async function fetchAnnualReview(year) {
  try {
    const res = await fetch(`${API_BASE}/annual_review?year=${year}`)
    if (!res.ok) throw new Error('Network error fetching annual review')
    annualReview.value = await res.json()
  } catch (error) {
    console.error(error)
  }
}

async function refreshAllData() {
  await Promise.all([
    fetchWorkers(),
    fetchAnnualReview(new Date().getFullYear())
  ])
}

function getTodayDateEST() {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const estOffset = -5 * 60 * 60 * 1000
  return new Date(utc + estOffset)
}

const form = reactive({
  names: [],
  date: getTodayDateEST(),  // 这里必须是 Date 对象
  loginTime: '',
  logoutTime: '',
  paid: false,
  hours: 0,
  overtime_hours: 0
})
console.log(getTodayDateEST())

const nameInput = ref('')
const message = ref('')
const isError = ref(false)

function addName() {
  const name = nameInput.value.trim()
  console.log('Trying to add:', name)
  if (name && !form.names.includes(name)) {
    form.names.push(name)
    console.log('Name added:', name)
  }
  nameInput.value = ''
  console.log('Input cleared, current names:', form.names)
}

function calculateHours(loginTime, logoutTime) {
  if (!loginTime || !logoutTime) return { hours: 0, overtime_hours: 0 }
  
  // 计算毫秒差
  const diffMs = logoutTime.getTime() - loginTime.getTime()
  if (diffMs <= 0) return { hours: 0, overtime_hours: 0 }  // 时间错误，返回0

  // 转换成小时
  const totalHours = diffMs / 1000 / 60 / 60

  // 正常工作8小时以内算 hours，超过部分算加班
  const hours = Math.min(totalHours, 8)
  const overtime_hours = totalHours > 8 ? totalHours - 8 : 0

  return { hours, overtime_hours }
}

async function submitEntry() {
  message.value = ''
  isError.value = false

  if (!form.date || !form.loginTime || !form.logoutTime || form.names.length === 0) {
    message.value = 'Please fill out all fields and add at least one name.'
    isError.value = true
    return
  }

  const loginDateTime = `${form.loginTime}`
  const logoutDateTime = `${form.logoutTime}`

  let allSuccessful = true

  for (const name of form.names) {
    try {
      const response = await fetch('http://127.0.0.1:5000/add_entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          date: form.date,
          login_time: loginDateTime,
          logout_time: logoutDateTime,
          paid: form.paid,
          hours: form.hours,
          overtime_hours:form.overtime_hours
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        allSuccessful = false
        console.error(`Error for ${name}:`, result.error || 'Failed to add entry')
      }
    } catch (err) {
      allSuccessful = false
      console.error(`Network error for ${name}:`, err.message)
    }
  }

  if (allSuccessful) {
    message.value = 'All entries added successfully!'
    isError.value = false
    form.names = []
    form.date = getTodayDateEST()
    form.loginTime = ''
    form.logoutTime = ''
    form.paid = false
    nameInput.value = ''
    refreshAllData()
  } else {
    message.value = 'Some entries failed to add. Check console for details.'
    isError.value = true
  }
}

// unpaidByWorker will be an object: { Alice: [], Bob: [], Charlie: [] }
const unpaidByWorker = ref({})

const fetchUnpaidForAll = async () => {
  unpaidByWorker.value = {}

  for (const worker of workers.value) {
    console.log('Fetching unpaid for:', worker)
    try {
      const res = await axios.get(`${API_BASE}/attendance/unpaid?name=${encodeURIComponent(worker)}`)
      console.log(`Response for ${worker}:`, res.data)
      unpaidByWorker.value[worker] = res.data.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    } catch (err) {
      console.error(`Error fetching unpaid for ${worker}:`, err)
      unpaidByWorker.value[worker] = []
    }
  }
}

function summaryMethod({ columns, data }) {
  const sums = []
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = 'Total'
      return
    }
    if (column.property === 'hours') {
      sums[index] = data.reduce((sum, row) => sum + (row.hours || 0), 0).toFixed(1)
    } else if (column.property === 'overtime_hours') {
      sums[index] = data.reduce((sum, row) => sum + (row.overtime_hours || 0), 0).toFixed(1)
    } else {
      sums[index] = ''
    }
  })
  return sums
}

async function deleteEntry(entryId: number) {
  if (!confirm('Are you sure you want to delete this entry?')) return
  try {
    const res = await fetch(`${API_BASE}/delete_entry/${entryId}`, {
      method: 'DELETE'
    })
    refreshAllData()
    fetchUnpaidForAll() 
    if (res.ok) {
      // Find which worker has this entry
      for (const worker in unpaidByWorker.value) {
        const entries = unpaidByWorker.value[worker]
        if (Array.isArray(entries)) {
          unpaidByWorker.value[worker] = entries.filter(e => e.id !== entryId)
        }
      }
      ElMessage.success('Entry deleted successfully')
    } else {
      ElMessage.error('Failed to delete entry')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('Error deleting entry')
  }
}

const editDialogVisible = ref(false)
const editForm = ref<any>({})

// 辅助函数：字符串转 Date（时分）
function timeStrToDate(str: string | undefined) {
  if (!str) return null
  const [h, m] = str.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

// 打开编辑时调用，确保时间字段是 Date 对象
function openEdit(data: any) {
  editForm.value = { ...data }
  editForm.value.login_time = timeStrToDate(data.login_time)
  editForm.value.logout_time = timeStrToDate(data.logout_time)
  editDialogVisible.value = true
}

// 计算工时
watch(
  () => [editForm.value.login_time, editForm.value.logout_time],
  ([loginTime, logoutTime]) => {
    if (!loginTime || !logoutTime) {
      editForm.value.hours = 0
      editForm.value.overtime_hours = 0
      return
    }
    const diffMs = logoutTime.getTime() - loginTime.getTime()
    if (diffMs <= 0) {
      editForm.value.hours = 0
      editForm.value.overtime_hours = 0
      return
    }
    const diffHours = diffMs / (1000 * 60 * 60)
    const normalHours = Math.min(diffHours, 8)
    const overtime = Math.max(diffHours - 8, 0)
    editForm.value.hours = Math.round(normalHours * 2) / 2
    editForm.value.overtime_hours = Math.round(overtime * 2) / 2
  }
)

function formatDate(d: any) {
  if (!d) return null
  const date = new Date(d)
  return date.toISOString().split('T')[0] // "YYYY-MM-DD"
}

function formatTime(t: any) {
  if (!t) return null

  // If it's already a string like "09:00:00" or "09:00"
  if (typeof t === 'string') {
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(t)) {
      return t.length === 5 ? `${t}:00` : t // add seconds if missing
    }
    return null // not in a valid time format
  }

  // If it's a Date object
  if (t instanceof Date) {
    const hh = String(t.getHours()).padStart(2, '0')
    const mm = String(t.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}:00`
  }

  return null
}

async function saveEdit() {
  try {
    const payload = {
      ...editForm.value,
      date: formatDate(editForm.value.date),
      login_time: formatTime(editForm.value.login_time),
      logout_time: formatTime(editForm.value.logout_time),
    }
    console.log(`${API_BASE}/update_entry/${editForm.value.id}`)
    const res = await fetch(`${API_BASE}/update_entry/${editForm.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      for (const worker in unpaidByWorker.value) {
        const idx = unpaidByWorker.value[worker].findIndex(e => e.id === editForm.value.id)
        if (idx > -1) unpaidByWorker.value[worker][idx] = { ...payload }
      }
      ElMessage.success('Entry updated successfully')
      editDialogVisible.value = false
    } else {
      ElMessage.error('Failed to update entry')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('Error updating entry')
  }
}
function toDate(timeStr) {
  if (typeof timeStr !== 'string') {
    // 如果传进来的是 Date 对象，就格式化成字符串再解析
    if (timeStr instanceof Date) {
      const h = timeStr.getHours().toString().padStart(2, '0')
      const m = timeStr.getMinutes().toString().padStart(2, '0')
      timeStr = `${h}:${m}`
    } else {
      // 不是字符串也不是 Date，返回 null 或抛错
      return null
    }
  }
  const [h, m] = timeStr.split(':')
  const d = new Date()
  d.setHours(Number(h), Number(m), 0, 0)
  return d
}

watch(
  () => [editForm.value.login_time, editForm.value.logout_time],
  ([newLogin, newLogout]) => {
    const loginDate = toDate(newLogin)
    const logoutDate = toDate(newLogout)
    const { hours, overtime_hours } = calculateHours(loginDate, logoutDate)
    editForm.value.hours = hours
    editForm.value.overtime_hours = overtime_hours
  }
)
onMounted(async () => {
  await refreshAllData()  // 先拿 workers 和年度数据
  await fetchUnpaidForAll()  // 再拿每个人的未付数据
})
</script>