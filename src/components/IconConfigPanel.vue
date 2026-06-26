<template>
  <el-dialog 
    title="图标配置" 
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    width="800px"
    :close-on-click-modal="false"
  >
    <div class="config-layout">
      <div class="icon-selector">
        <div class="selector-title">选择图标</div>
        <div class="icon-grid">
          <div 
            v-for="(icon, key) in iconKeys" 
            :key="key"
            class="icon-card"
            :class="{ active: selectedKey === key }"
            @click="selectIcon(key)"
          >
            <div class="icon-card-preview">
              <img 
                v-if="config[key]?.image" 
                :src="config[key].image" 
                class="card-img" 
                :style="{ width: '60px', height: '60px' }"
              />
              <svg v-else viewBox="0 0 64 64" class="card-svg">
                <circle cx="32" cy="32" r="30" :fill="icon.color"/>
                <text x="32" y="38" text-anchor="middle" fill="white" font-size="24" font-weight="bold">{{ icon.symbol }}</text>
              </svg>
            </div>
            <div class="icon-card-label">{{ icon.label }}</div>
            <div class="icon-card-indicator" v-if="selectedKey === key">
              <el-icon><Check /></el-icon>
            </div>
          </div>
        </div>
      </div>
      
      <div class="config-detail">
        <div class="detail-header">
          <span class="detail-title">{{ iconKeys[selectedKey]?.label || '图标配置' }}</span>
          <span class="detail-color" :style="{ backgroundColor: iconKeys[selectedKey]?.color }"></span>
        </div>
        
        <el-form :model="config[selectedKey]" label-width="80px">
          <el-form-item label="上传图标">
            <div class="upload-area" @click="triggerUpload(selectedKey)">
              <input 
                type="file" 
                :ref="selectedKey + 'FileInput'"
                class="file-input" 
                accept="image/jpeg,image/png,image/svg+xml"
                @change="handleFileChange($event, selectedKey)"
              />
              <div v-if="config[selectedKey]?.image" class="upload-preview">
                <img :src="config[selectedKey].image" class="preview-img" />
                <button class="remove-btn" @click.stop="removeImage(selectedKey)">
                  <el-icon><Delete /></el-icon>
                </button>
              </div>
              <div v-else class="upload-placeholder">
                <el-icon class="upload-icon"><Upload /></el-icon>
                <span class="upload-text">点击上传</span>
                <span class="upload-hint">JPG、PNG、SVG，≤2MB</span>
              </div>
            </div>
          </el-form-item>
          
          <el-form-item label="图标尺寸">
            <el-slider 
              v-model="config[selectedKey].size" 
              :min="32" 
              :max="120" 
              :step="2"
              @change="handleConfigChange"
            />
            <span class="slider-value">{{ config[selectedKey].size }}px</span>
          </el-form-item>
          
          <el-form-item label="水平位置">
            <el-input-number 
              v-model="config[selectedKey].x" 
              :min="-50" 
              :max="50" 
              :step="1"
              @change="handleConfigChange"
            />
            <span class="position-hint">相对于中心偏移(px)</span>
          </el-form-item>
          
          <el-form-item label="垂直位置">
            <el-input-number 
              v-model="config[selectedKey].y" 
              :min="-50" 
              :max="50" 
              :step="1"
              @change="handleConfigChange"
            />
            <span class="position-hint">相对于中心偏移(px)</span>
          </el-form-item>
          
          <div class="drag-preview">
            <div 
              class="drag-icon"
              :style="getDragIconStyle(selectedKey)"
              @mousedown="startDrag($event, selectedKey)"
            >
              <img v-if="config[selectedKey]?.image" :src="config[selectedKey].image" class="preview-img" />
              <svg v-else viewBox="0 0 64 64" class="preview-svg">
                <circle cx="32" cy="32" r="30" :fill="iconKeys[selectedKey]?.color"/>
                <text x="32" y="38" text-anchor="middle" fill="white" font-size="28" font-weight="bold">{{ iconKeys[selectedKey]?.symbol }}</text>
              </svg>
            </div>
            <span class="drag-hint">拖拽调整位置</span>
          </div>
        </el-form>
      </div>
    </div>
    
    <div class="config-actions">
      <el-button @click="resetConfig">重置为默认</el-button>
      <el-button type="primary" @click="saveConfig">保存配置</el-button>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, Delete, Check } from '@element-plus/icons-vue'

const props = defineProps({
  visible: Boolean,
  currentConfig: Object
})

const emit = defineEmits(['update:visible', 'update:config'])

const iconKeys = {
  income: { label: '本月总收入', color: '#67C23A', symbol: '+' },
  expense: { label: '本月总支出', color: '#F56C6C', symbol: '-' },
  balance: { label: '本月结余', color: '#409EFF', symbol: '$' }
}

const defaultConfig = {
  income: { size: 64, x: 0, y: 0, image: '' },
  expense: { size: 64, x: 0, y: 0, image: '' },
  balance: { size: 64, x: 0, y: 0, image: '' }
}

const config = reactive({})
const fileInputRefs = reactive({})
const selectedKey = ref('income')

const MAX_FILE_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml']

let dragState = {
  dragging: false,
  targetKey: null,
  startX: 0,
  startY: 0,
  startConfigX: 0,
  startConfigY: 0
}

function initConfig() {
  Object.keys(iconKeys).forEach(key => {
    config[key] = {
      size: props.currentConfig?.[key]?.size ?? defaultConfig[key].size,
      x: props.currentConfig?.[key]?.x ?? defaultConfig[key].x,
      y: props.currentConfig?.[key]?.y ?? defaultConfig[key].y,
      image: props.currentConfig?.[key]?.image ?? ''
    }
  })
}

function selectIcon(key) {
  selectedKey.value = key
}

function triggerUpload(key) {
  nextTick(() => {
    fileInputRefs[key]?.click()
  })
}

function handleFileChange(event, key) {
  const file = event.target.files?.[0]
  if (!file) return
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    ElMessage.error('不支持的文件格式，请上传 JPG、PNG 或 SVG 格式的图片')
    event.target.value = ''
    return
  }
  
  if (file.size > MAX_FILE_SIZE) {
    ElMessage.error('文件大小超过限制，最大支持 2MB')
    event.target.value = ''
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    config[key].image = e.target?.result
    handleConfigChange()
    ElMessage.success('图标上传成功')
  }
  reader.onerror = () => {
    ElMessage.error('图片读取失败，请重试')
  }
  reader.readAsDataURL(file)
  
  event.target.value = ''
}

function removeImage(key) {
  config[key].image = ''
  handleConfigChange()
}

function getDragIconStyle(key) {
  return {
    width: `${config[key].size}px`,
    height: `${config[key].size}px`,
    transform: `translate(${config[key].x}px, ${config[key].y}px)`
  }
}

function handleConfigChange() {
  emit('update:config', { ...config })
}

function startDrag(event, key) {
  dragState.dragging = true
  dragState.targetKey = key
  dragState.startX = event.clientX
  dragState.startY = event.clientY
  dragState.startConfigX = config[key].x
  dragState.startConfigY = config[key].y
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(event) {
  if (!dragState.dragging || !dragState.targetKey) return
  
  const deltaX = event.clientX - dragState.startX
  const deltaY = event.clientY - dragState.startY
  
  const key = dragState.targetKey
  config[key].x = Math.max(-50, Math.min(50, dragState.startConfigX + deltaX))
  config[key].y = Math.max(-50, Math.min(50, dragState.startConfigY + deltaY))
  
  emit('update:config', { ...config })
}

function stopDrag() {
  dragState.dragging = false
  dragState.targetKey = null
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

function resetConfig() {
  Object.keys(iconKeys).forEach(key => {
    config[key] = { ...defaultConfig[key] }
  })
  emit('update:config', { ...config })
  ElMessage.info('已重置为默认配置')
}

function saveConfig() {
  localStorage.setItem('icon_config', JSON.stringify(config))
  emit('update:config', { ...config })
  emit('update:visible', false)
  ElMessage.success('图标配置已保存')
}

watch(() => props.visible, (val) => {
  if (val) {
    initConfig()
    selectedKey.value = 'income'
  }
})

watch(() => props.currentConfig, (val) => {
  if (val) {
    initConfig()
  }
}, { deep: true })

onMounted(() => {
  initConfig()
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<style scoped>
.config-layout {
  display: flex;
  gap: 24px;
}

.icon-selector {
  width: 220px;
  flex-shrink: 0;
}

.selector-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.icon-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.icon-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: #fafafa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border: 2px solid transparent;
}

.icon-card:hover {
  background-color: #f0f5ff;
}

.icon-card.active {
  background-color: #ecf5ff;
  border-color: #409EFF;
}

.icon-card-preview {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.card-img,
.card-svg {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.icon-card-label {
  flex: 1;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.icon-card.active .icon-card-label {
  color: #409EFF;
}

.icon-card-indicator {
  color: #409EFF;
  font-size: 18px;
}

.config-detail {
  flex: 1;
  min-width: 0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 20px;
}

.detail-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.upload-area {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.upload-area:hover {
  border-color: #409EFF;
  background-color: #f0f5ff;
}

.file-input {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 1;
}

.upload-preview {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 6px;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border: none;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.remove-btn:hover {
  background-color: #F56C6C;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.upload-icon {
  font-size: 28px;
  color: #909399;
}

.upload-text {
  font-size: 14px;
  color: #606266;
}

.upload-hint {
  font-size: 11px;
  color: #909399;
}

.slider-value {
  margin-left: 12px;
  font-size: 14px;
  color: #606266;
  min-width: 60px;
  display: inline-block;
}

.position-hint {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

.drag-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 150px;
  background-color: #fafafa;
  border-radius: 8px;
  position: relative;
  margin-top: 8px;
}

.drag-icon {
  cursor: move;
  transition: transform 0.1s ease;
}

.preview-svg {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.drag-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.config-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

@media (max-width: 768px) {
  .config-layout {
    flex-direction: column;
  }
  
  .icon-selector {
    width: 100%;
  }
  
  .icon-grid {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .icon-card {
    flex: 1;
    min-width: calc(33.33% - 8px);
    flex-direction: column;
    gap: 8px;
  }
  
  .icon-card-label {
    font-size: 12px;
  }
}
</style>
