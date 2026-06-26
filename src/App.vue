<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <div class="header-title">
          <h1 class="app-title">收支记账单</h1>
          <p class="app-subtitle">轻松记录每一笔收支</p>
        </div>
        <div class="header-actions">
          <el-button 
            type="text" 
            class="icon-config-btn"
            @click="showIconConfig = true"
          >
            <el-icon><Tools /></el-icon>
            <span class="btn-text">图标配置</span>
          </el-button>
          <LedgerSelector @change="handleLedgerChange" />
        </div>
      </div>
    </header>
    
    <main class="app-main">
      <div class="top-section">
        <StatsPanel 
          :records="records" 
          :budget="currentLedgerBudget"
          :icon-config="iconConfig"
          @filter="handleStatsFilter" 
        />
        <ChartPanel :records="filteredRecords" />
      </div>
      
      <div class="main-content">
        <div class="left-panel">
          <BillForm @submit="handleAddRecord" />
        </div>
        
        <div class="right-panel">
          <FilterPanel 
            :initial-month="filters.month"
            :initial-type="filters.type"
            :initial-category="filters.category"
            @filter="handleFilter" 
            :filtered-records="filteredRecords" 
            :ledger-id="currentLedgerId"
          />
          <BillList 
            :records="filteredRecords" 
            @delete="handleDeleteRecord" 
            @update="handleUpdateRecord"
            @add="handleAddRecord"
          />
        </div>
      </div>
    </main>
    
    <footer class="app-footer">
      <p>数据存储于本地 localStorage</p>
    </footer>
    
    <IconConfigPanel 
      v-model:visible="showIconConfig"
      :current-config="iconConfig"
      @update:config="handleIconConfigChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Tools } from '@element-plus/icons-vue'
import BillForm from './components/BillForm.vue'
import BillList from './components/BillList.vue'
import FilterPanel from './components/FilterPanel.vue'
import StatsPanel from './components/StatsPanel.vue'
import ChartPanel from './components/ChartPanel.vue'
import LedgerSelector from './components/LedgerSelector.vue'
import IconConfigPanel from './components/IconConfigPanel.vue'
import { 
  getBillRecords, 
  addBillRecord, 
  deleteBillRecord, 
  updateBillRecord,
  getCurrentLedger,
  getLedgerList
} from './utils/storage'

const currentLedgerId = ref('')
const records = ref([])
const filters = ref({
  month: '',
  type: '',
  category: ''
})

const showIconConfig = ref(false)
const iconConfig = ref({
  income: { size: 64, x: 0, y: 0, image: '' },
  expense: { size: 64, x: 0, y: 0, image: '' },
  balance: { size: 64, x: 0, y: 0, image: '' }
})

const currentLedgerBudget = computed(() => {
  const ledgers = getLedgerList()
  const current = ledgers.find(l => l.id === currentLedgerId.value)
  return current ? current.budget : 0
})

const filteredRecords = computed(() => {
  let result = [...records.value]
  
  if (filters.value.month) {
    result = result.filter(r => r.date.startsWith(filters.value.month))
  }
  
  if (filters.value.type) {
    result = result.filter(r => r.type === filters.value.type)
  }
  
  if (filters.value.category) {
    result = result.filter(r => r.category === filters.value.category)
  }
  
  return result.sort((a, b) => new Date(b.date) - new Date(a.date))
})

function handleAddRecord(record) {
  addBillRecord(currentLedgerId.value, record)
  loadRecords()
}

function handleDeleteRecord(id) {
  deleteBillRecord(currentLedgerId.value, id)
  loadRecords()
}

function handleUpdateRecord(record) {
  updateBillRecord(currentLedgerId.value, record.id, record)
  loadRecords()
}

function handleFilter(newFilters) {
  filters.value = newFilters
}

function handleStatsFilter(statsFilters) {
  if (statsFilters.type) {
    filters.value.type = filters.value.type === statsFilters.type ? '' : statsFilters.type
    filters.value.category = ''
  }
}

function handleLedgerChange(ledgerId) {
  currentLedgerId.value = ledgerId
  filters.value = { month: '', type: '', category: '' }
  loadRecords()
}

function loadRecords() {
  records.value = getBillRecords(currentLedgerId.value)
}

function loadIconConfig() {
  try {
    const saved = localStorage.getItem('icon_config')
    if (saved) {
      iconConfig.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('加载图标配置失败:', error)
  }
}

function handleIconConfigChange(newConfig) {
  iconConfig.value = newConfig
}

onMounted(() => {
  currentLedgerId.value = getCurrentLedger()
  loadRecords()
  loadIconConfig()
})

watch(currentLedgerId, () => {
  loadRecords()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f7fa;
  color: #303133;
  min-height: 100vh;
}

#app {
  min-height: 100vh;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #409EFF 0%, #667EEA 100%);
  color: white;
  padding: 20px 20px;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.3);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.header-title {
  flex: 1;
}

.app-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.app-subtitle {
  font-size: 14px;
  opacity: 0.8;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-config-btn {
  color: white;
  border-color: rgba(255, 255, 255, 0.3);
  padding: 6px 12px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.icon-config-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.btn-text {
  display: inline-block;
}

.app-main {
  flex: 1;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.top-section {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.top-section > *:first-child {
  flex: 1;
}

.top-section > *:last-child {
  width: 380px;
  flex-shrink: 0;
}

.main-content {
  display: flex;
  gap: 20px;
}

.left-panel {
  width: 380px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-panel {
  flex: 1;
  min-width: 0;
}

.app-footer {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 12px;
  background-color: #fff;
  border-top: 1px solid #ebeef5;
}

@media (max-width: 992px) {
  .top-section {
    flex-direction: column;
  }
  
  .top-section > *:last-child {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
  }
  
  .main-content {
    flex-direction: column;
  }
  
  .left-panel {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
  }
  
  .right-panel {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .btn-text {
    display: none;
  }
  
  .app-title {
    font-size: 24px;
  }
  
  .app-main {
    padding: 12px;
  }
  
  .main-content {
    gap: 12px;
  }
  
  .left-panel {
    gap: 12px;
  }
}

@media (max-width: 320px) {
  .app-title {
    font-size: 20px;
  }
  
  .app-header {
    padding: 16px 12px;
  }
}
</style>
