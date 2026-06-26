<template>
  <el-card class="filter-panel-card" shadow="hover">
    <el-form :model="filters" inline class="filter-form">
      <el-form-item label="月份">
        <el-date-picker 
          v-model="filters.month" 
          type="month" 
          placeholder="选择月份"
          value-format="YYYY-MM"
          @change="handleFilter"
        />
      </el-form-item>
      <el-form-item label="类型">
        <el-select 
          v-model="filters.type" 
          placeholder="全部"
          @change="handleTypeChange"
          style="width: 120px;"
        >
          <el-option label="全部" value="" />
          <el-option label="收入" value="income" />
          <el-option label="支出" value="expense" />
        </el-select>
      </el-form-item>
      <el-form-item label="分类">
        <el-select 
          v-model="filters.category" 
          placeholder="全部"
          @change="handleFilter"
          style="width: 120px;"
        >
          <el-option label="全部" value="" />
          <el-option 
            v-for="cat in currentCategories" 
            :key="cat" 
            :label="cat" 
            :value="cat" 
          />
        </el-select>
      </el-form-item>
      <div class="filter-actions">
        <el-form-item>
          <el-button @click="handleClear">清除筛选</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="showExportDialog = true">
            导出Excel
          </el-button>
        </el-form-item>
      </div>
    </el-form>
  </el-card>

  <!-- 导出选择弹窗 -->
  <el-dialog 
    title="导出Excel" 
    v-model="showExportDialog" 
    width="350px"
    :close-on-click-modal="false"
  >
    <div class="export-options">
      <p class="export-hint">请选择导出范围：</p>
      <el-radio-group v-model="exportScope">
        <el-radio label="all">导出全部账单</el-radio>
        <el-radio label="filtered">导出当前筛选账单</el-radio>
      </el-radio-group>
    </div>
    <template #footer>
      <el-button @click="showExportDialog = false">取消</el-button>
      <el-button type="primary" @click="handleExport" :loading="exportLoading">
        {{ exportLoading ? '导出中...' : '确认导出' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import { getBillRecords } from '../utils/storage'
import { CATEGORIES } from '../utils/constants'

const props = defineProps({
  initialMonth: {
    type: String,
    default: ''
  },
  initialType: {
    type: String,
    default: ''
  },
  initialCategory: {
    type: String,
    default: ''
  },
  filteredRecords: {
    type: Array,
    default: () => []
  },
  ledgerId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['filter'])

const filters = reactive({
  month: props.initialMonth,
  type: props.initialType,
  category: props.initialCategory
})

const showExportDialog = ref(false)
const exportScope = ref('all')
const exportLoading = ref(false)

const currentCategories = computed(() => {
  if (!filters.type) {
    return [...CATEGORIES.expense, ...CATEGORIES.income]
  }
  return CATEGORIES[filters.type] || []
})

function handleFilter() {
  emit('filter', { ...filters })
}

function handleTypeChange() {
  filters.category = ''
  emit('filter', { ...filters })
}

function handleClear() {
  filters.month = ''
  filters.type = ''
  filters.category = ''
  emit('filter', { ...filters })
}

watch(() => [props.initialMonth, props.initialType, props.initialCategory], ([month, type, category]) => {
  filters.month = month
  filters.type = type
  filters.category = category
})

function getCurrentMonth() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

async function handleExport() {
  exportLoading.value = true
  
  try {
    let exportData = []
    if (exportScope.value === 'all') {
      exportData = getBillRecords(props.ledgerId)
    } else {
      exportData = [...props.filteredRecords]
    }
    
    if (exportData.length === 0) {
      ElMessage.warning('暂无数据可导出')
      showExportDialog.value = false
      exportLoading.value = false
      return
    }
    
    const excelData = exportData.map(record => ({
      '日期': record.date,
      '收支类型': record.type === 'income' ? '收入' : '支出',
      '分类': record.category,
      '金额': record.type === 'income' ? `+${record.amount}` : `-${record.amount}`,
      '备注': record.note || '-'
    }))
    
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const columnWidths = [
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 30 }
    ]
    worksheet['!cols'] = columnWidths
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '账单记录')
    
    const filename = `收支账单_${getCurrentMonth()}.xlsx`
    XLSX.writeFile(workbook, filename)
    
    showExportDialog.value = false
    ElMessage.success(`导出成功！共导出 ${exportData.length} 条记录`)
  } catch (error) {
    console.error('导出Excel失败:', error)
    ElMessage.error('导出失败，请重试')
  } finally {
    exportLoading.value = false
  }
}
</script>

<style scoped>
.filter-panel-card {
  border-radius: 8px;
  margin-bottom: 16px;
}

.filter-form {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  justify-content: space-between;
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 确保导出按钮内文字垂直居中 */
.filter-actions :deep(.el-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  line-height: 32px;
}

.filter-actions :deep(.el-button span) {
  display: inline-flex;
  align-items: center;
  height: 100%;
  line-height: normal;
}

.export-options {
  padding: 10px 0;
}

.export-hint {
  margin-bottom: 16px;
  color: #606266;
  font-size: 14px;
}

@media (max-width: 768px) {
  .filter-form {
    flex-wrap: wrap;
  }
  
  .filter-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 8px;
  }
}

@media (max-width: 480px) {
  .filter-actions {
    width: 100%;
    justify-content: center;
  }
}
</style>
