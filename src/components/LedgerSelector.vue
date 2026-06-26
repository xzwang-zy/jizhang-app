<template>
  <div class="ledger-selector">
    <el-dropdown trigger="click" @command="handleCommand" ref="dropdownRef">
      <span class="dropdown-trigger">
        <span class="current-ledger-name">{{ currentLedgerName }}</span>
        <el-icon class="dropdown-icon">
          <ArrowDown />
        </el-icon>
      </span>
      <template #dropdown>
        <div class="dropdown-content">
          <div 
            v-for="ledger in ledgerList" 
            :key="ledger.id"
            class="ledger-item"
            @click.stop="handleSelectLedger(ledger.id)"
          >
            <div 
              class="ledger-name-wrapper"
              @dblclick.stop="handleDoubleClick(ledger)"
            >
              <input
                v-if="editingId === ledger.id"
                ref="editInputRef"
                v-model="editingName"
                class="ledger-edit-input"
                @blur="handleEditBlur(ledger)"
                @keyup.enter="handleEditConfirm(ledger)"
                @click.stop
              />
              <span v-else class="ledger-name">{{ ledger.name }}</span>
              <span v-if="ledger.id === currentLedgerId" class="current-tag">当前</span>
            </div>
            <button 
              v-if="!isDefaultLedger(ledger.id)"
              class="delete-btn"
              @click.stop="handleItemDelete(ledger)"
              title="删除账本"
            >
              <el-icon><Delete /></el-icon>
            </button>
          </div>
          
          <div class="dropdown-divider"></div>
          
          <div class="add-section">
            <input
              v-if="showAddInput"
              ref="addInputRef"
              v-model="newLedgerName"
              class="add-input"
              placeholder="输入账本名称"
              @blur="handleAddBlur"
              @keyup.enter="handleAddConfirm"
              @click.stop
            />
            <div v-else class="add-trigger" @click.stop="handleShowAddInput">
              <span class="add-icon">+</span> 新增账本
            </div>
          </div>
        </div>
      </template>
    </el-dropdown>

    <el-dialog 
      title="删除账本" 
      v-model="showDeleteDialog" 
      width="350px"
      :close-on-click-modal="false"
    >
      <div class="delete-warning">
        <el-icon class="warning-icon">
          <Warning />
        </el-icon>
        <p>确定要删除「{{ deletingLedgerName }}」账本吗？</p>
        <p class="warning-detail">删除后，该账本下的所有账单数据将被永久清除，此操作不可撤销。</p>
      </div>
      <template #footer>
        <el-button @click="showDeleteDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete" :loading="deleteLoading">
          {{ deleteLoading ? '删除中...' : '确认删除' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Warning, Delete } from '@element-plus/icons-vue'
import { 
  getLedgerList, 
  getCurrentLedger, 
  saveCurrentLedger, 
  addLedger, 
  deleteLedger as removeLedger,
  updateLedger,
  DEFAULT_LEDGERS 
} from '../utils/storage'

const emit = defineEmits(['change'])

const ledgerList = ref([])
const currentLedgerId = ref('')
const showDeleteDialog = ref(false)
const deleteLoading = ref(false)
const deletingLedgerId = ref('')
const dropdownRef = ref(null)

const showAddInput = ref(false)
const newLedgerName = ref('')
const addInputRef = ref(null)

const editingId = ref('')
const editingName = ref('')
const originalName = ref('')
const editInputRef = ref(null)

const currentLedgerName = computed(() => {
  const ledger = ledgerList.value.find(l => l.id === currentLedgerId.value)
  return ledger ? ledger.name : '选择账本'
})

const deletingLedgerName = computed(() => {
  const ledger = ledgerList.value.find(l => l.id === deletingLedgerId.value)
  return ledger ? ledger.name : ''
})

function isDefaultLedger(id) {
  return DEFAULT_LEDGERS.some(l => l.id === id)
}

function loadLedgers() {
  ledgerList.value = getLedgerList()
}

function loadCurrentLedger() {
  currentLedgerId.value = getCurrentLedger()
}

function handleSelectLedger(id) {
  if (id !== currentLedgerId.value) {
    currentLedgerId.value = id
    saveCurrentLedger(id)
    emit('change', id)
    ElMessage.success(`已切换至「${ledgerList.value.find(l => l.id === id)?.name}」账本`)
  }
}

function handleDoubleClick(ledger) {
  if (isDefaultLedger(ledger.id)) {
    ElMessage.info('默认账本名称不可修改')
    return
  }
  editingId.value = ledger.id
  editingName.value = ledger.name
  originalName.value = ledger.name
  nextTick(() => {
    editInputRef.value?.focus()
    editInputRef.value?.select()
  })
}

function handleEditBlur(ledger) {
  if (editingId.value === ledger.id) {
    handleEditConfirm(ledger)
  }
}

function handleEditConfirm(ledger) {
  const newName = editingName.value.trim()
  if (!newName) {
    editingName.value = originalName.value
    editingId.value = ''
    return
  }
  if (newName === originalName.value) {
    editingId.value = ''
    return
  }
  const exists = ledgerList.value.some(l => l.id !== ledger.id && l.name === newName)
  if (exists) {
    ElMessage.warning('该账本名称已存在')
    editingName.value = originalName.value
    editingId.value = ''
    return
  }
  updateLedger(ledger.id, { name: newName })
  loadLedgers()
  editingId.value = ''
  ElMessage.success('账本名称修改成功')
}

function handleItemDelete(ledger) {
  deletingLedgerId.value = ledger.id
  showDeleteDialog.value = true
}

async function confirmDelete() {
  deleteLoading.value = true
  try {
    const success = removeLedger(deletingLedgerId.value)
    if (success) {
      loadLedgers()
      const defaultLedger = ledgerList.value[0]
      if (defaultLedger) {
        currentLedgerId.value = defaultLedger.id
        saveCurrentLedger(defaultLedger.id)
        emit('change', defaultLedger.id)
      }
      showDeleteDialog.value = false
      deletingLedgerId.value = ''
      ElMessage.success('账本删除成功')
    } else {
      ElMessage.warning('无法删除最后一个账本')
    }
  } catch (error) {
    console.error('删除账本失败:', error)
    ElMessage.error('删除失败，请重试')
  } finally {
    deleteLoading.value = false
  }
}

function handleShowAddInput() {
  showAddInput.value = true
  newLedgerName.value = ''
  nextTick(() => {
    addInputRef.value?.focus()
  })
}

function handleAddBlur() {
  handleAddConfirm()
}

function handleAddConfirm() {
  const name = newLedgerName.value.trim()
  if (!name) {
    showAddInput.value = false
    return
  }
  const exists = ledgerList.value.some(l => l.name === name)
  if (exists) {
    ElMessage.warning('该账本名称已存在')
    nextTick(() => {
      addInputRef.value?.focus()
    })
    return
  }
  addLedger(name, 0)
  loadLedgers()
  showAddInput.value = false
  newLedgerName.value = ''
  ElMessage.success('账本添加成功')
}

onMounted(() => {
  loadLedgers()
  loadCurrentLedger()
})

watch(showAddInput, (val) => {
  if (val) {
    nextTick(() => {
      addInputRef.value?.focus()
    })
  }
})
</script>

<style scoped>
.ledger-selector {
  position: relative;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dropdown-trigger:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.current-ledger-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  font-size: 14px;
  transition: transform 0.3s ease;
}

.dropdown-content {
  padding: 8px 0;
}

.ledger-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.ledger-item:hover {
  background-color: #f5f7fa;
}

.ledger-name-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.ledger-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: #303133;
}

.current-tag {
  font-size: 12px;
  color: #409EFF;
  background-color: #ecf5ff;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  color: #909399;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  opacity: 0;
}

.ledger-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: #F56C6C;
  background-color: #fef0f0;
}

.dropdown-divider {
  height: 1px;
  background-color: #ebeef5;
  margin: 8px 0;
}

.add-section {
  padding: 8px 12px;
}

.add-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #409EFF;
  cursor: pointer;
  transition: color 0.2s ease;
}

.add-trigger:hover {
  color: #66B1FF;
}

.add-icon {
  font-weight: bold;
}

.add-input {
  width: 100%;
  padding: 6px 12px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

.add-input:focus {
  border-color: #409EFF;
}

.ledger-edit-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #409EFF;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  background-color: #fff;
}

.delete-warning {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 10px 0;
}

.warning-icon {
  font-size: 24px;
  color: #E6A23C;
  margin-bottom: 12px;
}

.warning-warning p {
  margin: 8px 0;
  color: #606266;
}

.warning-detail {
  font-size: 13px;
  color: #909399;
  margin-top: 8px !important;
}

@media (max-width: 768px) {
  .dropdown-trigger {
    padding: 6px 12px;
    font-size: 14px;
  }
  
  .current-ledger-name {
    max-width: 80px;
  }
}

@media (max-width: 480px) {
  .dropdown-trigger {
    padding: 5px 10px;
    font-size: 13px;
  }
  
  .current-ledger-name {
    max-width: 60px;
  }
}
</style>
