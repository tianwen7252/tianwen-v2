/**
 * Tests for OrderNoteTags component.
 * Verifies tag loading from DB, selection toggling, add/delete custom tags.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrderNoteTags } from './order-note-tags'
import {
  getOrderTypeRepo,
  resetMockRepositories,
} from '@/test/mock-repositories'

// Mock the repository provider to use in-memory mock repositories
vi.mock('@/lib/repositories', () => ({
  getOrderTypeRepo: () => getOrderTypeRepo(),
}))

// ── Test constants (must match DEFAULT_ORDER_TYPES seed data) ──────────

const TAG_BOOTH = '\u6524\u4f4d'
const TAG_DELIVERY = '\u5916\u9001'
const TAG_PHONE_PICKUP = '\u96fb\u8a71\u81ea\u53d6'
const TAG_CUSTOM = '\u5e38\u5ba2'
const TAG_URGENT = '\u6025\u55ae'
const TAG_SPECIAL = '\u4e94\u6298(50%)'
const SECTION_TITLE = '\u8a02\u55ae\u5099\u8a3b'
const INPUT_PLACEHOLDER = '\u65b0\u589e\u5099\u8a3b'
const BTN_DELETE = '\u522a\u9664'
const BTN_CANCEL = '\u53d6\u6d88'
const CONFIRM_DELETE_PATTERN = /\u78ba\u5b9a\u522a\u9664/

// ── Helpers ────────────────────────────────────────────────────────────

function renderOrderNoteTags(
  overrides: {
    selectedTags?: readonly string[]
    onSelectedTagsChange?: (tags: string[]) => void
  } = {},
) {
  const props = {
    selectedTags: overrides.selectedTags ?? [],
    onSelectedTagsChange: overrides.onSelectedTagsChange ?? vi.fn(),
  }
  return { ...render(<OrderNoteTags {...props} />), props }
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('OrderNoteTags', () => {
  beforeEach(() => {
    resetMockRepositories()
  })

  afterEach(() => {
    resetMockRepositories()
  })

  describe('loading tags from DB', () => {
    it('should render all default order types from DB', async () => {
      renderOrderNoteTags()
      await screen.findByText(TAG_BOOTH)
      expect(screen.getByText(TAG_DELIVERY)).toBeTruthy()
      expect(screen.getByText(TAG_PHONE_PICKUP)).toBeTruthy()
    })

    it('should render section title with i18n key order.orderNote', async () => {
      renderOrderNoteTags()
      await screen.findByText(SECTION_TITLE)
    })

    it('should load custom tags from DB along with defaults', async () => {
      await getOrderTypeRepo().create({
        name: TAG_CUSTOM,
        priority: 4,
        type: 'order',
        color: '',
      })

      renderOrderNoteTags()

      await screen.findByText(TAG_BOOTH)
      expect(screen.getByText(TAG_DELIVERY)).toBeTruthy()
      expect(screen.getByText(TAG_PHONE_PICKUP)).toBeTruthy()
      expect(screen.getByText(TAG_CUSTOM)).toBeTruthy()
    })

    it('should NOT show delete button on default tags', async () => {
      renderOrderNoteTags()
      await screen.findByText(TAG_BOOTH)

      const tagEl = screen.getByText(TAG_BOOTH).closest('[data-tag]')
      expect(tagEl).toBeTruthy()
      const deleteBtn = tagEl!.querySelector('[data-tag-delete]')
      expect(deleteBtn).toBeNull()
    })
  })

  describe('tag selection', () => {
    it('should call onSelectedTagsChange with tag added when clicking unselected tag', async () => {
      const onSelectedTagsChange = vi.fn()
      const user = userEvent.setup()
      renderOrderNoteTags({ onSelectedTagsChange })

      await screen.findByText(TAG_BOOTH)
      await user.click(screen.getByText(TAG_BOOTH))
      expect(onSelectedTagsChange).toHaveBeenCalledWith([TAG_BOOTH])
    })

    it('should call onSelectedTagsChange with tag removed when clicking selected tag', async () => {
      const onSelectedTagsChange = vi.fn()
      const user = userEvent.setup()
      renderOrderNoteTags({
        selectedTags: [TAG_BOOTH, TAG_DELIVERY],
        onSelectedTagsChange,
      })

      await screen.findByText(TAG_BOOTH)
      await user.click(screen.getByText(TAG_BOOTH))
      expect(onSelectedTagsChange).toHaveBeenCalledWith([TAG_DELIVERY])
    })

    it('should highlight selected tags with active style', async () => {
      renderOrderNoteTags({ selectedTags: [TAG_BOOTH] })
      await screen.findByText(TAG_BOOTH)
      const tagEl = screen.getByText(TAG_BOOTH).closest('[data-tag]')
      expect(tagEl).toBeTruthy()
      expect(tagEl!.className).toContain('bg-primary')
    })

    it('should show unselected tags with muted style', async () => {
      renderOrderNoteTags({ selectedTags: [] })
      await screen.findByText(TAG_BOOTH)
      const tagEl = screen.getByText(TAG_BOOTH).closest('[data-tag]')
      expect(tagEl).toBeTruthy()
      expect(tagEl!.className).toContain('bg-muted')
    })
  })

  describe('adding custom tags', () => {
    it('should add a new tag via input and Enter key', async () => {
      const user = userEvent.setup()
      renderOrderNoteTags()
      await screen.findByText(TAG_BOOTH)

      const input = screen.getByPlaceholderText(INPUT_PLACEHOLDER)
      await user.type(input, TAG_CUSTOM + '{Enter}')

      await screen.findByText(TAG_CUSTOM)
    })

    it('should clear input after adding a tag', async () => {
      const user = userEvent.setup()
      renderOrderNoteTags()
      await screen.findByText(TAG_BOOTH)

      const input = screen.getByPlaceholderText(
        INPUT_PLACEHOLDER,
      ) as HTMLInputElement
      await user.type(input, TAG_CUSTOM + '{Enter}')

      await waitFor(() => {
        expect(input.value).toBe('')
      })
    })

    it('should reject empty input (whitespace only)', async () => {
      const user = userEvent.setup()
      renderOrderNoteTags()
      await screen.findByText(TAG_BOOTH)

      const input = screen.getByPlaceholderText(INPUT_PLACEHOLDER)
      await user.type(input, '   {Enter}')

      const allTypes = await getOrderTypeRepo().findAll()
      expect(allTypes.length).toBe(3)
    })

    it('should reject duplicate of existing tag name', async () => {
      const user = userEvent.setup()
      renderOrderNoteTags()
      await screen.findByText(TAG_BOOTH)

      const input = screen.getByPlaceholderText(INPUT_PLACEHOLDER)
      await user.type(input, TAG_BOOTH + '{Enter}')

      const allTags = screen.getAllByText(TAG_BOOTH)
      expect(allTags).toHaveLength(1)
    })
  })

  describe('deleting custom tags', () => {
    it('should show delete button on custom tags', async () => {
      await getOrderTypeRepo().create({
        name: TAG_CUSTOM,
        priority: 4,
        type: 'order',
        color: '',
      })

      renderOrderNoteTags()
      await screen.findByText(TAG_CUSTOM)

      const tagEl = screen.getByText(TAG_CUSTOM).closest('[data-tag]')
      expect(tagEl).toBeTruthy()
      const deleteBtn = tagEl!.querySelector('[data-tag-delete]')
      expect(deleteBtn).toBeTruthy()
    })

    it('should show confirmation popover when X button is clicked', async () => {
      await getOrderTypeRepo().create({
        name: TAG_CUSTOM,
        priority: 4,
        type: 'order',
        color: '',
      })

      const user = userEvent.setup()
      renderOrderNoteTags()
      await screen.findByText(TAG_CUSTOM)

      const tagEl = screen.getByText(TAG_CUSTOM).closest('[data-tag]')
      const deleteBtn = tagEl!.querySelector('[data-tag-delete]')!
      await user.click(deleteBtn)

      expect(screen.getByText(CONFIRM_DELETE_PATTERN)).toBeTruthy()
    })

    it('should remove custom tag when delete is confirmed in popover', async () => {
      await getOrderTypeRepo().create({
        name: TAG_CUSTOM,
        priority: 4,
        type: 'order',
        color: '',
      })
      await getOrderTypeRepo().create({
        name: TAG_URGENT,
        priority: 5,
        type: 'order',
        color: '',
      })

      const user = userEvent.setup()
      renderOrderNoteTags()
      await screen.findByText(TAG_CUSTOM)

      const tagEl = screen.getByText(TAG_CUSTOM).closest('[data-tag]')
      const deleteBtn = tagEl!.querySelector('[data-tag-delete]')!
      await user.click(deleteBtn)
      await user.click(screen.getByRole('button', { name: BTN_DELETE }))

      await waitFor(() => {
        expect(screen.queryByText(TAG_CUSTOM)).toBeNull()
      })
      expect(screen.getByText(TAG_URGENT)).toBeTruthy()
    })

    it('should also remove deleted tag from selectedTags when confirmed', async () => {
      await getOrderTypeRepo().create({
        name: TAG_CUSTOM,
        priority: 4,
        type: 'order',
        color: '',
      })

      const onSelectedTagsChange = vi.fn()
      const user = userEvent.setup()
      renderOrderNoteTags({
        selectedTags: [TAG_CUSTOM, TAG_BOOTH],
        onSelectedTagsChange,
      })
      await screen.findByText(TAG_CUSTOM)

      const tagEl = screen.getByText(TAG_CUSTOM).closest('[data-tag]')
      const deleteBtn = tagEl!.querySelector('[data-tag-delete]')!
      await user.click(deleteBtn)
      await user.click(screen.getByRole('button', { name: BTN_DELETE }))

      await waitFor(() => {
        expect(onSelectedTagsChange).toHaveBeenCalledWith([TAG_BOOTH])
      })
    })

    it('should not delete tag when cancel is clicked in popover', async () => {
      await getOrderTypeRepo().create({
        name: TAG_CUSTOM,
        priority: 4,
        type: 'order',
        color: '',
      })

      const user = userEvent.setup()
      renderOrderNoteTags()
      await screen.findByText(TAG_CUSTOM)

      const tagEl = screen.getByText(TAG_CUSTOM).closest('[data-tag]')
      const deleteBtn = tagEl!.querySelector('[data-tag-delete]')!
      await user.click(deleteBtn)
      await user.click(screen.getByRole('button', { name: BTN_CANCEL }))

      expect(screen.getByText(TAG_CUSTOM)).toBeTruthy()
    })
  })

  describe('edge cases', () => {
    it('should handle special characters in tag names', async () => {
      const user = userEvent.setup()
      renderOrderNoteTags()
      await screen.findByText(TAG_BOOTH)

      const input = screen.getByPlaceholderText(INPUT_PLACEHOLDER)
      await user.type(input, TAG_SPECIAL + '{Enter}')

      await screen.findByText(TAG_SPECIAL)
    })

    it('should trim whitespace from input before adding', async () => {
      const user = userEvent.setup()
      renderOrderNoteTags()
      await screen.findByText(TAG_BOOTH)

      const input = screen.getByPlaceholderText(INPUT_PLACEHOLDER)
      await user.type(input, '  ' + TAG_CUSTOM + '  {Enter}')

      await screen.findByText(TAG_CUSTOM)
    })

    it('should handle selecting a custom tag', async () => {
      await getOrderTypeRepo().create({
        name: TAG_CUSTOM,
        priority: 4,
        type: 'order',
        color: '',
      })

      const onSelectedTagsChange = vi.fn()
      const user = userEvent.setup()
      renderOrderNoteTags({ onSelectedTagsChange })
      await screen.findByText(TAG_CUSTOM)

      await user.click(screen.getByText(TAG_CUSTOM))
      expect(onSelectedTagsChange).toHaveBeenCalledWith([TAG_CUSTOM])
    })
  })
})
