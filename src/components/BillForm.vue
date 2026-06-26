<template>
  <el-card class="bill-form-card" shadow="hover">
    <template #header>
      <h3 class="card-title">收支录入</h3>
    </template>
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
      <el-form-item>
        <el-button type="primary" @click="handleSubmit" class="submit-btn">
          保存记录
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { CATEGORIES } from '../utils/constants'

const emit = defineEmits(['submit'])

const formRef = ref(null)
const form = ref({
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

function handleSubmit() {
  formRef.value.validate((valid) => {
    if (valid) {
      emit('submit', { ...form.value })
      handleReset()
      ElMessage.success('记录保存成功')
    }
  })
}

function handleReset() {
  form.value = {
    amount: null,
    type: 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  }
}
</script>

<style scoped>
.bill-form-card {
  border-radius: 8px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.submit-btn {
  margin-right: 12px;
}
</style>
