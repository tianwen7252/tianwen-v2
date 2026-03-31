import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Announcement } from '@/components/announcement/announcement'
import { RippleButton } from '@/components/ui/ripple-button'

// ─── AnnouncementPreview ─────────────────────────────────────────────────────

/**
 * Dev page for previewing the Announcement widget with different configurations.
 */
export function AnnouncementPreview() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <RippleButton
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
      >
        Show Admin Announcement
      </RippleButton>

      <Announcement
        open={open}
        variant="gold"
        title={
          <span className="text-3xl text-amber-900">
            {t('announcement.adminName')}
          </span>
        }
        shineColor="gold"
        transparent
        confetti={{ sideCannons: true, stars: true }}
        onDismiss={() => setOpen(false)}
      >
        <p className="text-lg text-amber-800/70">
          {t('announcement.loggedIn')}
        </p>
      </Announcement>
    </div>
  )
}
