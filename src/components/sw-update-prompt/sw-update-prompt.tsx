/**
 * Service worker update prompt.
 * Shows ConfirmModal when a new SW is waiting.
 * Shows notify.info when precaching completes (offline ready).
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSwUpdate } from '@/hooks/use-sw-update'
import { ConfirmModal } from '@/components/modal'
import { notify } from '@/components/ui/sonner'

export function SwUpdatePrompt() {
  const { t } = useTranslation()
  const { needRefresh, offlineReady, updateApp, dismissPrompt } = useSwUpdate()

  // Show info toast when offline ready
  useEffect(() => {
    if (offlineReady) {
      notify.info(t('sw.offlineReady'), { position: 'top-center' })
      dismissPrompt()
    }
  }, [offlineReady, dismissPrompt, t])

  return (
    <ConfirmModal
      open={needRefresh}
      animated
      title={t('sw.updateAvailable')}
      confirmText={t('sw.update')}
      cancelText={t('sw.later')}
      onConfirm={updateApp}
      onCancel={dismissPrompt}
    />
  )
}
