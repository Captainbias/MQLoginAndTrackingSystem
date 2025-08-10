<template>
  <div>
    <h2>Attendance Records</h2>
    <div v-for="worker in workers" :key="worker" style="margin-bottom: 40px;">
    <h3>{{ worker }} — Unpaid Attendance</h3>
    <el-table
      :data="unpaidByWorker[worker] || []"
      style="width: 100%"
      border
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
    </el-table>
  </div>

    <div>
      <h2>Add Attendance Entry</h2>
      <form @submit.prevent="submitEntry">
        <ul>
          <li v-for="(n, index) in form.names" :key="index">
            {{ n }}
            <button @click="form.names.splice(index, 1)">Remove</button>
          </li>
        </ul>
        <label for="name">Names:</label>
        <input
          id="name"
          list="worker-list"
          v-model="nameInput"
          @keydown.enter.prevent="addName"
          placeholder="Type a name and press Enter"
        /><button @click="addName">Add Name</button>
        <datalist id="worker-list">
          <option v-for="worker in workers" :key="worker" :value="worker" />
        </datalist><br />
        
        <label>
          Date (YYYY-MM-DD):
          <input v-model="form.date" type="date" required />
        </label><br />

        <label>
          Login Time (HH:MM):
          <select v-model="form.loginTime" required>
            <option disabled value="">Select login time</option>
            <option v-for="time in timeOptions" :key="time" :value="time">{{ time }}</option>
          </select>
        </label><br />

        <label>
          Logout Time (HH:MM):
          <select v-model="form.logoutTime" required>
            <option disabled value="">Select logout time</option>
            <option v-for="time in timeOptions" :key="time" :value="time">{{ time }}</option>
          </select>
        </label><br />

        <button type="submit">Add Entry</button>
      </form>

      <p v-if="message" :class="{ error: isError }">{{ message }}</p>
    </div>

    <h2>Annual Review</h2>
    <div v-for="(months, name) in annualReview" :key="name">
      <h3>{{ name }}</h3>
      <ul>
        <li v-for="(hours, month) in months" :key="month">
          Month {{ month }}: {{ hours }} hours
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive,ref, onMounted,computed } from 'vue'
import axios from 'axios'

const workers = ref([])
const attendanceRecords = ref([])
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

function getTodayDateStrEST() {
  const now = new Date()

  // Convert current time to UTC milliseconds
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)

  // EST offset is -5 hours from UTC
  const estOffset = -5 * 60 * 60 * 1000

  // Create a new Date object adjusted to EST
  const estDate = new Date(utc + estOffset)

  const yyyy = estDate.getFullYear()
  const mm = String(estDate.getMonth() + 1).padStart(2, '0')
  const dd = String(estDate.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const form = reactive({
  names: [],
  date: getTodayDateStrEST(),
  loginTime: '',
  logoutTime: '',
  paid: false,
  hours:0,
  overtime_hours:0
})

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
    form.date = ''
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

onMounted(async () => {
  await refreshAllData()  // 先拿 workers 和年度数据
  await fetchUnpaidForAll()  // 再拿每个人的未付数据
})
</script>