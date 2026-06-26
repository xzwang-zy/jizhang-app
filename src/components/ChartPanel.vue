<template>
  <el-card class="chart-panel-card" shadow="hover">
    <template #header>
      <h3 class="card-title">收支统计</h3>
      <el-radio-group v-model="activeChart" class="chart-tabs">
        <el-radio label="expense">支出</el-radio>
        <el-radio label="income">收入</el-radio>
      </el-radio-group>
    </template>
    <div ref="chartRef" class="chart-container"></div>
  </el-card>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import * as echarts from 'echarts'
import { CATEGORY_COLORS } from '../utils/constants'

const props = defineProps({
  records: {
    type: Array,
    default: () => []
  }
})

const chartRef = ref(null)
const activeChart = ref('expense')
let chartInstance = null

const chartData = computed(() => {
  const filtered = props.records.filter(r => r.type === activeChart.value)
  const grouped = {}
  
  filtered.forEach(r => {
    const category = r.category
    grouped[category] = (grouped[category] || 0) + (Number(r.amount) || 0)
  })
  
  return Object.entries(grouped).map(([name, value]) => ({
    name,
    value,
    itemStyle: {
      color: CATEGORY_COLORS[name] || '#409EFF'
    }
  }))
})

function initChart() {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

function updateChart() {
  if (!chartInstance) return
  
  const data = chartData.value
  
  if (data.length === 0) {
    chartInstance.setOption({
      series: []
    })
    return
  }
  
  chartInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: '3%',
      left: 'center',
      right: 'center',
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 12,
      textStyle: {
        fontSize: 11
      },
      pageTextStyle: {
        fontSize: 12
      },
      formatter: function(name) {
        return name
      }
    },
    series: [
      {
        name: activeChart.value === 'expense' ? '支出' : '收入',
        type: 'pie',
        radius: ['30%', '70%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data
      }
    ]
  })
}

function handleResize() {
  chartInstance?.resize()
}

watch(activeChart, () => {
  updateChart()
})

watch(() => props.records, () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped>
.chart-panel-card {
  border-radius: 8px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.chart-tabs {
  margin-left: auto;
}

.chart-container {
  width: 100%;
  height: 350px;
}

@media (max-width: 768px) {
  .chart-container {
    height: 300px;
  }
}

@media (max-width: 480px) {
  .chart-container {
    height: 280px;
  }
  
  .card-title {
    font-size: 16px;
  }
}
</style>
