import { useInitStore } from '@/stores/init-store'
import { RippleButton } from '@/components/ui/ripple-button'

export function InitUiPreview() {
  const forceInitUI = useInitStore(s => s.forceInitUI)
  const setForceInitUI = useInitStore(s => s.setForceInitUI)

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg">Init UI Preview</h2>
      <p className="text-muted-foreground">
        Toggle the initialization overlay. Press Escape or click the button
        again to close.
      </p>
      <RippleButton
        onClick={() => setForceInitUI(!forceInitUI)}
        className={
          forceInitUI
            ? 'w-fit bg-red-500 px-4 py-2 text-white hover:bg-red-600'
            : 'w-fit bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90'
        }
      >
        {forceInitUI ? '關閉初始化 UI' : '初始化 UI'}
      </RippleButton>
    </div>
  )
}
