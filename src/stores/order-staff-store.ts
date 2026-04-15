import { create } from 'zustand'
import { getEmployeeRepo } from '@/lib/repositories/provider'

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderStaffState {
  readonly orderStaffId: string | null
  readonly orderStaffName: string | null
  readonly orderStaffAvatar: string | undefined
}

interface OrderStaffActions {
  setOrderStaff: (id: string, name: string, avatar?: string) => void
  clearOrderStaff: () => void
  initFromDefault: () => Promise<void>
}

// ─── Persistence ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'order-staff'

interface PersistedOrderStaff {
  readonly id: string
  readonly name: string
  readonly avatar?: string
}

function loadPersisted(): PersistedOrderStaff | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedOrderStaff
  } catch {
    return null
  }
}

function persist(id: string, name: string, avatar?: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, name, avatar }))
  } catch {
    // Ignore storage errors
  }
}

function clearPersisted(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage errors
  }
}

// ─── Store ───────────────────────────────────────────────────────────────────

const persisted = loadPersisted()

export const useOrderStaffStore = create<OrderStaffState & OrderStaffActions>(
  set => ({
    orderStaffId: persisted?.id ?? null,
    orderStaffName: persisted?.name ?? null,
    orderStaffAvatar: persisted?.avatar,

    setOrderStaff: (id, name, avatar) => {
      persist(id, name, avatar)
      set({ orderStaffId: id, orderStaffName: name, orderStaffAvatar: avatar })
    },

    clearOrderStaff: () => {
      clearPersisted()
      set({
        orderStaffId: null,
        orderStaffName: null,
        orderStaffAvatar: undefined,
      })
    },

    initFromDefault: async () => {
      // Skip if already loaded from localStorage
      const current = useOrderStaffStore.getState()
      if (current.orderStaffId) return

      try {
        const defaultStaff = await getEmployeeRepo().findDefaultOrderStaff()
        if (defaultStaff) {
          persist(defaultStaff.id, defaultStaff.name, defaultStaff.avatar)
          set({
            orderStaffId: defaultStaff.id,
            orderStaffName: defaultStaff.name,
            orderStaffAvatar: defaultStaff.avatar,
          })
        }
      } catch {
        // DB not ready or no default staff — silent fallback
      }
    },
  }),
)
