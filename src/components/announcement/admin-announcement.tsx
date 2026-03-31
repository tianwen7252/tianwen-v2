import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/stores/app-store'
import { Announcement } from './announcement'

// ─── AdminAnnouncement ────────────────────────────────────────────────────────

/**
 * Shows a confetti announcement modal when an admin logs in.
 * Reads open state from the global app store and dismisses via setShowAdminAnnouncement.
 */
export function AdminAnnouncement() {
  const { t } = useTranslation()
  const show = useAppStore(s => s.showAdminAnnouncement)
  const dismiss = useAppStore(s => s.setShowAdminAnnouncement)

  return (
    <Announcement
      open={show}
      title={t('announcement.adminName')}
      confetti={{ sideCannons: true, stars: true }}
      onDismiss={() => dismiss(false)}
    >
      <p className="text-lg text-muted-foreground">
        {t('announcement.loggedIn')}
      </p>
    </Announcement>
  )
}
