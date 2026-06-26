const LEDGER_LIST_KEY = 'ledger_list'
const CURRENT_LEDGER_KEY = 'current_ledger'
const BILL_RECORDS_PREFIX = 'bill_records_'

export const DEFAULT_LEDGERS = [
  { id: 'daily', name: '日常', budget: 0, createdAt: new Date().toISOString() },
  { id: 'travel', name: '旅游', budget: 0, createdAt: new Date().toISOString() },
  { id: 'work', name: '工作', budget: 0, createdAt: new Date().toISOString() }
]

export function getLedgerList() {
  try {
    const data = localStorage.getItem(LEDGER_LIST_KEY)
    if (data) {
      return JSON.parse(data)
    }
    saveLedgerList(DEFAULT_LEDGERS)
    return DEFAULT_LEDGERS
  } catch (error) {
    console.error('读取账本列表失败:', error)
    return DEFAULT_LEDGERS
  }
}

export function saveLedgerList(ledgers) {
  try {
    localStorage.setItem(LEDGER_LIST_KEY, JSON.stringify(ledgers))
    return true
  } catch (error) {
    console.error('保存账本列表失败:', error)
    return false
  }
}

export function addLedger(name, budget = 0) {
  const ledgers = getLedgerList()
  const newLedger = {
    id: Date.now().toString(),
    name,
    budget,
    createdAt: new Date().toISOString()
  }
  ledgers.push(newLedger)
  return saveLedgerList(ledgers)
}

export function deleteLedger(id) {
  const ledgers = getLedgerList()
  const filtered = ledgers.filter(l => l.id !== id)
  if (filtered.length === 0) {
    return false
  }
  localStorage.removeItem(BILL_RECORDS_PREFIX + id)
  return saveLedgerList(filtered)
}

export function updateLedger(id, updatedLedger) {
  const ledgers = getLedgerList()
  const index = ledgers.findIndex(l => l.id === id)
  if (index !== -1) {
    ledgers[index] = { ...ledgers[index], ...updatedLedger }
    return saveLedgerList(ledgers)
  }
  return false
}

export function getCurrentLedger() {
  try {
    const data = localStorage.getItem(CURRENT_LEDGER_KEY)
    if (data) {
      const ledgers = getLedgerList()
      if (ledgers.some(l => l.id === data)) {
        return data
      }
    }
    const defaultLedger = getLedgerList()[0]
    if (defaultLedger) {
      saveCurrentLedger(defaultLedger.id)
      return defaultLedger.id
    }
    return ''
  } catch (error) {
    console.error('读取当前账本失败:', error)
    const defaultLedger = getLedgerList()[0]
    return defaultLedger ? defaultLedger.id : ''
  }
}

export function saveCurrentLedger(id) {
  try {
    localStorage.setItem(CURRENT_LEDGER_KEY, id)
    return true
  } catch (error) {
    console.error('保存当前账本失败:', error)
    return false
  }
}

export function getBillRecords(ledgerId) {
  try {
    const key = BILL_RECORDS_PREFIX + ledgerId
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('读取账单数据失败:', error)
    return []
  }
}

export function saveBillRecords(ledgerId, records) {
  try {
    const key = BILL_RECORDS_PREFIX + ledgerId
    localStorage.setItem(key, JSON.stringify(records))
    return true
  } catch (error) {
    console.error('保存账单数据失败:', error)
    return false
  }
}

export function addBillRecord(ledgerId, record) {
  const records = getBillRecords(ledgerId)
  const newRecord = {
    ...record,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  }
  records.unshift(newRecord)
  return saveBillRecords(ledgerId, records)
}

export function deleteBillRecord(ledgerId, id) {
  const records = getBillRecords(ledgerId)
  const filteredRecords = records.filter(record => record.id !== id)
  return saveBillRecords(ledgerId, filteredRecords)
}

export function updateBillRecord(ledgerId, id, updatedRecord) {
  const records = getBillRecords(ledgerId)
  const index = records.findIndex(record => record.id === id)
  if (index !== -1) {
    records[index] = { ...records[index], ...updatedRecord }
    return saveBillRecords(ledgerId, records)
  }
  return false
}
