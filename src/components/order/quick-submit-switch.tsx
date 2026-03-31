import { useTranslation } from 'react-i18next'
import { Switch } from '@/components/ui/switch'

// ─── Types ──────────────────────────────────────────────────────────────────

interface QuickSubmitSwitchProps {
  readonly checked: boolean
  readonly onCheckedChange: (checked: boolean) => void
}

// ─── Component ──────────────────────────────────────────────────────────────

/** Toggle switch for quick submit mode — skips confirmation modal when enabled. */
export function QuickSubmitSwitch({
  checked,
  onCheckedChange,
}: QuickSubmitSwitchProps) {
  const { t } = useTranslation()

  return (
    <label className="flex items-center gap-2 cursor-pointer select-none mr-5">
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
      <span className="text-base text-muted-foreground">
        {t('order.quickSubmit')}
      </span>
    </label>
  )
}
