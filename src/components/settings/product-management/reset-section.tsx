/**
 * Reset-to-default section for product management.
 * Resets commodity types, commodities, and order types to seed data.
 * Does NOT touch employees or attendances.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCcw } from 'lucide-react'
import { ConfirmModal } from '@/components/modal'
import { RippleButton } from '@/components/ui/ripple-button'
import { notify } from '@/components/ui/sonner'
import { resetCommodityDataAsync } from '@/lib/default-data'

interface ResetSectionProps {
  readonly onReset: () => void
}

export function ResetSection({ onReset }: ResetSectionProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = useCallback(async () => {
    setIsLoading(true)
    try {
      await resetCommodityDataAsync()
      setIsOpen(false)
      notify.success(t('productMgmt.reset.success'))
      onReset()
    } catch {
      notify.error(t('productMgmt.reset.error'))
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }, [t, onReset])

  const handleCancel = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <div className="space-y-3">
      <RippleButton
        onClick={() => setIsOpen(true)}
        rippleColor="rgba(255,255,255,0.3)"
        className="w-full rounded-lg bg-destructive px-4 py-3 text-base text-destructive-foreground transition hover:opacity-90"
      >
        <RotateCcw className="mr-2 inline-block size-4" />
        {t('productMgmt.reset.button')}
      </RippleButton>

      <ConfirmModal
        open={isOpen}
        title={t('productMgmt.reset.confirmTitle')}
        variant="red"
        shineColor="red"
        confirmText={t('common.confirm')}
        loading={isLoading}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      >
        <p className="text-base text-foreground">
          {t('productMgmt.reset.confirmMessage')}
        </p>
      </ConfirmModal>
    </div>
  )
}
