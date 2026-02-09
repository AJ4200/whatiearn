import { openDB, type DBSchema, type IDBPDatabase } from "idb"

export interface WorkRecord {
  id?: number
  date: string
  clockIn: string
  clockOut?: string
  breakStart?: string
  breakEnd?: string
  totalHours: number
  workType: "normal" | "sunday" | "holiday"
  rate: number
  earnings: number
  isActive: boolean
  isManualEntry?: boolean
}

export interface CustomHoliday {
  id?: number
  date: string
  name: string
}

export interface Settings {
  normalRate: number
  sundayRate: number
  holidayRate: number
  deductions: Array<{ id?: string; name: string; amount: number }>
  employeeName?: string
  employeeId?: string
  companyName?: string
}

interface AppDB extends DBSchema {
  workRecords: {
    key: number
    value: WorkRecord
  }
  settings: {
    key: string
    value: Settings & { key: string }
  }
  customHolidays: {
    key: number
    value: CustomHoliday
  }
}

let dbInstance: IDBPDatabase<AppDB> | null = null

async function getDB(): Promise<IDBPDatabase<AppDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<AppDB>("WhatIEarnDB", 2, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains("workRecords")) {
        const workStore = db.createObjectStore("workRecords", {
          keyPath: "id",
          autoIncrement: true,
        })
        workStore.createIndex("date", "date")
        workStore.createIndex("workType", "workType")
      }

      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" })
      }

      if (!db.objectStoreNames.contains("customHolidays")) {
        const holidayStore = db.createObjectStore("customHolidays", {
          keyPath: "id",
          autoIncrement: true,
        })
        holidayStore.createIndex("date", "date")
      }
    },
  })

  return dbInstance
}

const DEFAULT_SETTINGS: Settings = {
  normalRate: 0,
  sundayRate: 0,
  holidayRate: 0,
  deductions: [],
  employeeName: "",
  employeeId: "",
  companyName: "WhatIEarn",
}

class DatabaseManager {
  async init() {
    return getDB()
  }

  async addWorkRecord(record: Omit<WorkRecord, "id">) {
    const db = await getDB()
    return await db.add("workRecords", record as WorkRecord)
  }

  async updateWorkRecord(id: number, updates: Partial<WorkRecord>) {
    const db = await getDB()
    const record = await db.get("workRecords", id)
    if (record) {
      return await db.put("workRecords", { ...record, ...updates })
    }
  }

  async getWorkRecords(startDate?: string, endDate?: string) {
    const db = await getDB()
    let records = await db.getAll("workRecords")

    if (startDate && endDate) {
      records = records.filter((r) => r.date >= startDate && r.date <= endDate)
    }

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  async getWorkRecordByDate(date: string) {
    const db = await getDB()
    const records = await db.getAll("workRecords")
    return records.find((r) => r.date === date && !r.isActive)
  }

  async getActiveWorkRecord() {
    const db = await getDB()
    const records = await db.getAll("workRecords")
    return records.find((r) => r.isActive)
  }

  async saveSettings(settings: Partial<Settings>) {
    const db = await getDB()
    const current = await this.getSettings()
    return await db.put("settings", { key: "rates", ...current, ...settings })
  }

  async getSettings(): Promise<Settings> {
    const db = await getDB()
    const settings = await db.get("settings", "rates")
    return settings ? { ...DEFAULT_SETTINGS, ...settings } : DEFAULT_SETTINGS
  }

  async deleteWorkRecord(id: number) {
    const db = await getDB()
    return await db.delete("workRecords", id)
  }

  async addCustomHoliday(holiday: Omit<CustomHoliday, "id">) {
    const db = await getDB()
    return await db.add("customHolidays", holiday as CustomHoliday)
  }

  async getCustomHolidays() {
    const db = await getDB()
    return await db.getAll("customHolidays")
  }

  async getCustomHolidayByDate(date: string) {
    const db = await getDB()
    const holidays = await db.getAll("customHolidays")
    return holidays.find((h) => h.date === date)
  }

  async deleteCustomHoliday(id: number) {
    const db = await getDB()
    return await db.delete("customHolidays", id)
  }
}

export const dbManager = new DatabaseManager()
