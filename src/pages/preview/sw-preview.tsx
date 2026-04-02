import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/modal'
import { notify } from '@/components/ui/sonner'

export function SwPreview() {
  const { t } = useTranslation()
  const [showUpdate, setShowUpdate] = useState(false)

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Service Worker update prompt and offline-ready notification.
      </p>

      <section>
        <h2 className="mb-3 text-lg">Previews</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            className="bg-blue text-white hover:bg-blue/80"
            onClick={() => setShowUpdate(true)}
          >
            {t('sw.updateAvailable')}
          </Button>
          <Button
            className="bg-green text-white hover:bg-green/80"
            onClick={() =>
              notify.info(t('sw.offlineReady'), { position: 'top-center' })
            }
          >
            {t('sw.offlineReady')}
          </Button>
        </div>
      </section>

      <ConfirmModal
        open={showUpdate}
        animated
        title={t('sw.updateAvailable')}
        confirmText={t('sw.update')}
        cancelText={t('sw.later')}
        onConfirm={() => {
          setShowUpdate(false)
          notify.success('App updated!')
        }}
        onCancel={() => setShowUpdate(false)}
      />
    </div>
  )
}
