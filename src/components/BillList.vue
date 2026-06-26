<template>
  <el-card class="bill-list-card" shadow="hover">
    <template #header>
      <div class="header-row">
        <h3 class="card-title">账单列表</h3>
        <div class="header-actions">
          <span class="total-count">共 {{ records.length }} 条记录</span>
          <el-button type="primary" size="small" @click="handleAdd">
            新增账单
          </el-button>
        </div>
      </div>
    </template>
    <div v-if="records.length === 0" class="empty-state">
      <el-empty description="暂无账单记录，快来添加吧！" />
    </div>
    <div v-else>
      <el-table 
        :data="paginatedRecords" 
        class="bill-table"
        stripe
        :header-cell-style="{ background: '#f5f7fa' }"
      >
        <el-table-column prop="date" label="日期" width="100" />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 'income' ? 'success' : 'danger'">
              {{ row.type === 'income' ? '收入' : '支出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="80" />
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">
            <span :class="row.type === 'income' ? 'income-amount' : 'expense-amount'">
              {{ row.type === 'income' ? '+' : '-' }}{{ row.amount.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="备注" min-width="150">
          <template #default="{ row }">
            <span v-if="row.note">{{ row.note }}</span>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="text" 
              size="small" 
              @click="handleEdit(row)"
              class="edit-btn"
            >
              编辑
            </el-button>
            <el-button 
              type="text" 
              size="small" 
              @click="handleDelete(row.id)"
              class="delete-btn"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[8]"
          :page-size="pageSize"
          layout="total, prev, pager, next"
          :total="records.length"
          background
        />
      </div>
    </div>
  </el-card>

  <!-- 编辑/新增弹窗 -->
  <el-dialog 
    :title="isEditing ? '编辑账单' : '新增账单'" 
    v-model="showDialog" 
    width="450px"
    :close-on-click-modal="false"
  >
    <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
      <el-form-item label="金额" prop="amount">
        <el-input 
          v-model.number="form.amount" 
          type="number" 
          placeholder="请输入金额"
          :maxlength="12"
          prefix-icon="el-icon-money"
        />
      </el-form-item>
      <el-form-item label="类型" prop="type">
        <el-radio-group v-model="form.type">
          <el-radio label="expense">支出</el-radio>
          <el-radio label="income">收入</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="分类" prop="category">
        <el-select v-model="form.category" placeholder="请选择分类">
          <el-option 
            v-for="cat in currentCategories" 
            :key="cat" 
            :label="cat" 
            :value="cat" 
          />
        </el-select>
      </el-form-item>
      <el-form-item label="日期" prop="date">
        <el-date-picker 
          v-model="form.date" 
          type="date" 
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
      <el-form-item label="备注">
        <el-input 
          v-model="form.note" 
          type="textarea" 
          placeholder="请输入备注（最多200字）"
          :maxlength="200"
          show-word-limit
          :rows="2"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
        {{ isEditing ? '保存修改' : '保存记录' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { CATEGORIES } from '../utils/constants'

const props = defineProps({
  records: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['delete', 'update', 'add'])

const currentPage = ref(1)
const pageSize = ref(8)
const showDialog = ref(false)
const isEditing = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)

const form = ref({
  id: '',
  amount: null,
  type: 'expense',
  category: '',
  date: new Date().toISOString().split('T')[0],
  note: ''
})

const rules = {
  amount: [
    { required: true, message: '请输入金额', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value <= 0) {
          callback(new Error('金额必须为正数'))
        } else if (!/^\d+(\.\d{1,2})?$/.test(value.toString())) {
          callback(new Error('金额最多支持两位小数'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  type: [
    { required: true, message: '请选择收支类型', trigger: 'change' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  date: [
    { required: true, message: '请选择日期', trigger: 'change' }
  ]
}

const currentCategories = computed(() => {
  return CATEGORIES[form.value.type] || []
})

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return props.records.slice(start, end)
})

function handleSizeChange(val) {
  pageSize.value = val
  currentPage.value = 1
}

function handleCurrentChange(val) {
  currentPage.value = val
}

watch(() => props.records, () => {
  currentPage.value = 1
})

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条记录吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    emit('delete', id)
    ElMessage.success('删除成功')
  } catch {
    ElMessage.info('已取消删除')
  }
}

function handleAdd() {
  isEditing.value = false
  form.value = {
    id: '',
    amount: null,
    type: 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  }
  showDialog.value = true
}

function handleEdit(row) {
  isEditing.value = true
  form.value = {
    id: row.id,
    amount: Number(row.amount),
    type: row.type,
    category: row.category,
    date: row.date,
    note: row.note || ''
  }
  showDialog.value = true
}

function handleClose() {
  showDialog.value = false
}

async function handleSubmit() {
  submitLoading.value = true
  formRef.value.validate((valid) => {
    if (valid) {
      if (isEditing.value) {
        emit('update', { ...form.value })
        ElMessage.success('修改成功')
      } else {
        emit('add', { ...form.value })
        ElMessage.success('记录保存成功')
      }
      showDialog.value = false
    }
    submitLoading.value = false
  })
}
</script>

<style scoped>
.bill-list-card {
  border-radius: 8px;
}

.header-row {
  display: flex;
  align-items: center;
  width: 100%;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.total-count {
  font-size: 14px;
  color: #909399;
}

.empty-state {
  padding: 40px 0;
}

.bill-table {
  width: 100%;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0 10px;
}

.income-amount {
  color: #67C23A;
  font-weight: 600;
}

.expense-amount {
  color: #F56C6C;
  font-weight: 600;
}

.empty-text {
  color: #909399;
}

.edit-btn {
  color: #409EFF;
}

.edit-btn:hover {
  color: #66B1FF;
}

.delete-btn {
  color: #F56C6C;
}

.delete-btn:hover {
  color: #E6A23C;
}

@media (max-width: 768px) {
  .total-count {
    font-size: 12px;
  }
  
  .pagination-wrapper {
    padding: 15px 0 5px;
  }
}
</style>
