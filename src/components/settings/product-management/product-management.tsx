/**
 * Product Management settings page.
 * Orchestrates 4 sections with a shared refresh mechanism
 * and a unified "Save Settings" button.
 */

import { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Save, Plus, Pencil, Trash2, ArrowUpDown, Tag } from 'lucide-react'
import { ConfirmModal } from '@/components/modal'
import { RippleButton } from '@/components/ui/ripple-button'
import { ShineBorder } from '@/components/ui/shine-border'
import { ScrollArea } from '@/components/ui/scroll-area'
import { notify } from '@/components/ui/sonner'
import { CommodityTypeSection } from './commodity-type-section'
import { CommoditySection } from './commodity-section'
import { OrderTypeSection } from './order-type-section'
import { PriceChangeLogSection } from './price-change-log-section'
import { ResetSection } from './reset-section'
import type { SectionRef, ChangeSummaryItem } from './types'

export function ProductManagement() {
  const { t } = useTranslation()
  const [refreshKey, setRefreshKey] = useState(0)

  // Section refs for orchestrating saves
  const typeRef = useRef<SectionRef | null>(null)
  const commodityRef = useRef<SectionRef | null>(null)
  const orderTypeRef = useRef<SectionRef | null>(null)

  // Track which sections have changes
  const [changesMap, setChangesMap] = useState<Record<string, boolean>>({})
  const hasAnyChanges = Object.values(changesMap).some(Boolean)

  // Save confirm modal state
  const [isSaveOpen, setIsSaveOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [changeSummary, setChangeSummary] = useState<
    readonly ChangeSummaryItem[]
  >([])

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1)
    setChangesMap({})
  }, [])

  // Change callbacks for each section
  const handleTypeChanges = useCallback((has: boolean) => {
    setChangesMap(prev => ({ ...prev, types: has }))
  }, [])

  const handleCommodityChanges = useCallback((has: boolean) => {
    setChangesMap(prev => ({ ...prev, commodities: has }))
  }, [])

  const handleOrderTypeChanges = useCallback((has: boolean) => {
    setChangesMap(prev => ({ ...prev, orderTypes: has }))
  }, [])

  // Collect summaries and open confirm modal
  const handleSaveClick = useCallback(() => {
    const summaries: ChangeSummaryItem[] = [
      ...(typeRef.current?.getChangeSummary() ?? []),
      ...(commodityRef.current?.getChangeSummary() ?? []),
      ...(orderTypeRef.current?.getChangeSummary() ?? []),
    ]
    setChangeSummary(summaries)
    setIsSaveOpen(true)
  }, [])

  // Confirm save -- write all changes to DB
  const handleSaveConfirm = useCallback(async () => {
    setIsSaving(true)

    try {
      await typeRef.current?.save()
      await commodityRef.current?.save()
      await orderTypeRef.current?.save()

      setIsSaveOpen(false)
      notify.success(t('productMgmt.saveSuccess'))
      handleRefresh()
    } catch {
      notify.error(t('productMgmt.saveError'))
    } finally {
      setIsSaving(false)
    }
  }, [t, handleRefresh])

  const handleSaveCancel = useCallback(() => {
    setIsSaveOpen(false)
  }, [])

  return (
    <div className="space-y-8 p-6">
      {/* Header with title and save button */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-medium">{t('productMgmt.tabTitle')}</h3>
        <RippleButton
          disabled={!hasAnyChanges}
          className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg border border-border bg-card px-4 py-2 text-base text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleSaveClick}
        >
          {hasAnyChanges && (
            <ShineBorder
              shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']}
              duration={4}
              borderWidth={2}
            />
          )}
          <Save size={16} />
          {t('productMgmt.saveSettings')}
        </RippleButton>
      </div>

      <CommodityTypeSection
        refreshKey={refreshKey}
        onHasChanges={handleTypeChanges}
        sectionRef={typeRef}
      />
      <CommoditySection
        refreshKey={refreshKey}
        onHasChanges={handleCommodityChanges}
        sectionRef={commodityRef}
      />
      <OrderTypeSection
        refreshKey={refreshKey}
        onHasChanges={handleOrderTypeChanges}
        sectionRef={orderTypeRef}
      />
      <PriceChangeLogSection refreshKey={refreshKey} />
      <ResetSection onReset={handleRefresh} />

      {/* Save confirm modal -- shows all pending changes */}
      <ConfirmModal
        open={isSaveOpen}
        title={t('productMgmt.saveConfirmTitle')}
        variant="green"
        shineColor="green"
        confirmText={t('common.confirm')}
        loading={isSaving}
        onConfirm={handleSaveConfirm}
        onCancel={handleSaveCancel}
      >
        <div
          style={{
            height: Math.max(200, Math.min(changeSummary.length * 34 + 8, 400)),
          }}
        >
          <ScrollArea className="h-full pr-2" watchDeps={[changeSummary]}>
            <div className="space-y-2 text-base text-foreground">
              {changeSummary.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-muted-foreground">
                    {item.type === 'add' && <Plus size={16} />}
                    {item.type === 'edit' && <Pencil size={16} />}
                    {item.type === 'delete' && <Trash2 size={16} />}
                    {item.type === 'label' && <Tag size={16} />}
                    {item.type === 'reorder' && <ArrowUpDown size={16} />}
                  </span>
                  <span>{item.description}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </ConfirmModal>
    </div>
  )
}
