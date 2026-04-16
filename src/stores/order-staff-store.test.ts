import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useOrderStaffStore } from './order-staff-store'

const mockFindDefaultOrderStaff = vi.fn()

vi.mock('@/lib/repositories/provider', () => ({
  getEmployeeRepo: () => ({
    findDefaultOrderStaff: mockFindDefaultOrderStaff,
  }),
}))

const STORAGE_KEY = 'order-staff'

describe('useOrderStaffStore', () => {
  beforeEach(() => {
    localStorage.clear()
    mockFindDefaultOrderStaff.mockReset()
    useOrderStaffStore.setState({
      orderStaffId: null,
      orderStaffName: null,
      orderStaffAvatar: undefined,
    })
  })

  describe('setOrderStaff', () => {
    it('sets the order staff state', () => {
      useOrderStaffStore.getState().setOrderStaff('emp-002', '妞妞', 'fish.png')

      const state = useOrderStaffStore.getState()
      expect(state.orderStaffId).toBe('emp-002')
      expect(state.orderStaffName).toBe('妞妞')
      expect(state.orderStaffAvatar).toBe('fish.png')
    })

    it('persists to localStorage', () => {
      useOrderStaffStore.getState().setOrderStaff('emp-002', '妞妞', 'fish.png')

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored).toEqual({
        id: 'emp-002',
        name: '妞妞',
        avatar: 'fish.png',
      })
    })

    it('handles missing avatar', () => {
      useOrderStaffStore.getState().setOrderStaff('emp-001', 'Eric')

      const state = useOrderStaffStore.getState()
      expect(state.orderStaffId).toBe('emp-001')
      expect(state.orderStaffName).toBe('Eric')
      expect(state.orderStaffAvatar).toBeUndefined()
    })
  })

  describe('clearOrderStaff', () => {
    it('clears the order staff state', () => {
      useOrderStaffStore.getState().setOrderStaff('emp-002', '妞妞', 'fish.png')
      useOrderStaffStore.getState().clearOrderStaff()

      const state = useOrderStaffStore.getState()
      expect(state.orderStaffId).toBeNull()
      expect(state.orderStaffName).toBeNull()
      expect(state.orderStaffAvatar).toBeUndefined()
    })

    it('removes from localStorage', () => {
      useOrderStaffStore.getState().setOrderStaff('emp-002', '妞妞')
      useOrderStaffStore.getState().clearOrderStaff()

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })
  })

  describe('initFromDefault', () => {
    it('skips if already has a selection', async () => {
      useOrderStaffStore.getState().setOrderStaff('emp-001', 'Eric')

      await useOrderStaffStore.getState().initFromDefault()

      expect(mockFindDefaultOrderStaff).not.toHaveBeenCalled()
      expect(useOrderStaffStore.getState().orderStaffId).toBe('emp-001')
    })

    it('loads default from DB when no localStorage value', async () => {
      mockFindDefaultOrderStaff.mockResolvedValue({
        id: 'emp-002',
        name: '妞妞',
        avatar: 'fish.png',
        status: 'active',
        shiftType: 'regular',
        isAdmin: false,
        isDefaultOrderStaff: true,
        createdAt: 0,
        updatedAt: 0,
      })

      await useOrderStaffStore.getState().initFromDefault()

      const state = useOrderStaffStore.getState()
      expect(state.orderStaffId).toBe('emp-002')
      expect(state.orderStaffName).toBe('妞妞')
      expect(state.orderStaffAvatar).toBe('fish.png')
    })

    it('does nothing when no default staff in DB', async () => {
      mockFindDefaultOrderStaff.mockResolvedValue(undefined)

      await useOrderStaffStore.getState().initFromDefault()

      const state = useOrderStaffStore.getState()
      expect(state.orderStaffId).toBeNull()
    })

    it('handles DB errors gracefully', async () => {
      mockFindDefaultOrderStaff.mockRejectedValue(new Error('DB not ready'))

      await useOrderStaffStore.getState().initFromDefault()

      const state = useOrderStaffStore.getState()
      expect(state.orderStaffId).toBeNull()
    })
  })
})
