<template>
  <div class="stats-panel">
    <el-card 
      class="stat-card income-card" 
      shadow="hover"
      @click="handleCardClick('income')"
    >
      <div class="stat-icon-wrapper" :style="getWrapperStyle('income')">
        <img 
          v-if="iconConfig.income?.image" 
          :src="iconConfig.income.image" 
          class="stat-icon-img" 
          :style="getIconStyle('income')"
          alt="收入图标"
        />
        <svg v-else viewBox="0 0 64 64" class="stat-icon-svg" :style="getIconStyle('income')">
          <circle cx="32" cy="32" r="30" fill="#67C23A"/>
          <text x="32" y="38" text-anchor="middle" fill="white" font-size="28" font-weight="bold">+</text>
        </svg>
      </div>
      <div class="stat-content">
        <p class="stat-label">本月总收入</p>
        <p class="stat-value income">{{ formatAmount(income) }}</p>
      </div>
      <div class="click-hint">点击筛选</div>
    </el-card>
    <el-card 
      class="stat-card expense-card" 
      shadow="hover"
      @click="handleCardClick('expense')"
    >
      <div class="stat-icon-wrapper" :style="getWrapperStyle('expense')">
        <img 
          v-if="iconConfig.expense?.image" 
          :src="iconConfig.expense.image" 
          class="stat-icon-img" 
          :style="getIconStyle('expense')"
          alt="支出图标"
        />
        <svg v-else viewBox="0 0 64 64" class="stat-icon-svg" :style="getIconStyle('expense')">
          <circle cx="32" cy="32" r="30" fill="#F56C6C"/>
          <text x="32" y="38" text-anchor="middle" fill="white" font-size="28" font-weight="bold">-</text>
        </svg>
      </div>
      <div class="stat-content">
        <p class="stat-label">本月总支出</p>
        <p class="stat-value expense">{{ formatAmount(expense) }}</p>
      </div>
      <div class="click-hint">点击筛选</div>
    </el-card>
    <el-card class="stat-card balance-card" shadow="hover">
      <div class="stat-icon-wrapper" :style="getWrapperStyle('balance')">
        <img 
          v-if="iconConfig.balance?.image" 
          :src="iconConfig.balance.image" 
          class="stat-icon-img" 
          :style="getIconStyle('balance')"
          alt="结余图标"
        />
        <svg v-else viewBox="0 0 64 64" class="stat-icon-svg" :style="getIconStyle('balance')">
          <circle cx="32" cy="32" r="30" fill="#409EFF"/>
          <text x="32" y="38" text-anchor="middle" fill="white" font-size="28" font-weight="bold">$</text>
        </svg>
      </div>
      <div class="stat-content">
        <p class="stat-label">本月结余</p>
        <p class="stat-value" :class="balance >= 0 ? 'income' : 'expense'">
          {{ balance >= 0 ? '+' : '' }}{{ formatAmount(balance) }}
        </p>
        <div v-if="budget > 0" class="budget-info">
          <span class="budget-label">预算:</span>
          <span class="budget-value">{{ formatAmount(budget) }}</span>
          <span class="budget-remaining" :class="remainingBudget >= 0 ? 'success' : 'danger'">
            ({{ remainingBudget >= 0 ? '剩余' : '超支' }} {{ Math.abs(remainingBudget).toFixed(2) }})
          </span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  records: {
    type: Array,
    default: () => []
  },
  budget: {
    type: Number,
    default: 0
  },
  iconConfig: {
    type: Object,
    default: () => ({
      income: { size: 64, x: 0, y: 0, image: '' },
      expense: { size: 64, x: 0, y: 0, image: '' },
      balance: { size: 64, x: 0, y: 0, image: '' }
    })
  }
})

const emit = defineEmits(['filter'])

const income = computed(() => {
  return props.records
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
})

const expense = computed(() => {
  return props.records
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
})

const balance = computed(() => income.value - expense.value)

const remainingBudget = computed(() => props.budget - expense.value)

function formatAmount(amount) {
  return amount.toFixed(2)
}

function handleCardClick(type) {
  emit('filter', { type })
}

function getWrapperStyle(key) {
  const config = props.iconConfig[key] || { size: 64, x: 0, y: 0 }
  const wrapperSize = config.size + 16
  return {
    width: `${wrapperSize}px`,
    height: `${wrapperSize}px`
  }
}

function getIconStyle(key) {
  const config = props.iconConfig[key] || { size: 64, x: 0, y: 0 }
  return {
    width: `${config.size}px`,
    height: `${config.size}px`,
    transform: `translate(${config.x}px, ${config.y}px)`
  }
}
</script>

<style scoped>
.stats-panel {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 200px;
  max-width: 300px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.stat-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.stat-card:hover .stat-icon-wrapper {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon-svg,
.stat-icon-img {
  border-radius: 50%;
  transition: all 0.3s ease;
  flex-shrink: 0;
  object-fit: cover;
}

.stat-card:hover .stat-icon-svg,
.stat-card:hover .stat-icon-img {
  transform: rotate(-5deg);
}

.stat-content {
  text-align: center;
  width: 100%;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin: 0 0 8px 0;
  transition: color 0.3s ease;
}

.stat-card:hover .stat-label {
  color: #606266;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  transition: all 0.3s ease;
}

.stat-card:hover .stat-value {
  transform: scale(1.05);
}

.stat-value.income {
  color: #67C23A;
}

.stat-value.expense {
  color: #F56C6C;
}

.income-card .stat-icon-wrapper {
  border: 2px solid #67C23A;
}

.expense-card .stat-icon-wrapper {
  border: 2px solid #F56C6C;
}

.balance-card .stat-icon-wrapper {
  border: 2px solid #409EFF;
}

.click-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover .click-hint {
  opacity: 1;
}

.balance-card {
  cursor: default;
}

.balance-card:hover {
  transform: translateY(-4px);
}

.balance-card .click-hint {
  display: none;
}

.budget-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 13px;
}

.budget-label {
  color: #909399;
}

.budget-value {
  color: #409EFF;
  font-weight: 500;
}

.budget-remaining {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.budget-remaining.success {
  color: #67C23A;
  background-color: #f0f9eb;
}

.budget-remaining.danger {
  color: #F56C6C;
  background-color: #fef0f0;
}

@media (max-width: 768px) {
  .stats-panel {
    flex-direction: column;
  }
  
  .stat-card {
    max-width: 100%;
    flex-direction: row;
    justify-content: flex-start;
  }
  
  .stat-icon-wrapper {
    margin-bottom: 0;
    margin-right: 16px;
  }
  
  .stat-content {
    text-align: left;
  }
}

@media (max-width: 480px) {
  .stat-card {
    padding: 15px;
  }
  
  .stat-value {
    font-size: 20px;
  }
}
</style>
