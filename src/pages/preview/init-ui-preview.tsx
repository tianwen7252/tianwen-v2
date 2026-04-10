import { useInitStore } from '@/stores/init-store'
import { RippleButton } from '@/components/ui/ripple-button'

export function InitUiPreview() {
  const forceInitUI = useInitStore(s => s.forceInitUI)
  const setForceInitUI = useInitStore(s => s.setForceInitUI)
  const setErrorOverlayType = useInitStore(s => s.setErrorOverlayType)
  const forceWaitingUI = useInitStore(s => s.forceWaitingUI)
  const setForceWaitingUI = useInitStore(s => s.setForceWaitingUI)

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg">Init UI Preview</h2>
      <p className="text-muted-foreground">
        Toggle the initialization overlay. Press Escape or click the back button
        to close.
      </p>
      <RippleButton
        onClick={() => setForceInitUI(!forceInitUI)}
        className={
          forceInitUI
            ? 'w-fit rounded-full bg-red-500 px-4 py-2 text-white hover:bg-red-600'
            : 'w-fit rounded-full bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90'
        }
      >
        {forceInitUI ? '關閉初始化 UI' : '初始化 UI'}
      </RippleButton>

      <h2 className="mt-4 text-lg">Error Overlay Preview</h2>
      <p className="text-muted-foreground">
        Preview error pages with Event Horizon animation. Press Escape or click
        the back button to close.
      </p>
      <div className="flex gap-3">
        <RippleButton
          onClick={() => setErrorOverlayType('404')}
          className="w-fit rounded-full bg-amber-600 px-4 py-2 text-white hover:bg-amber-700"
        >
          404
        </RippleButton>
        <RippleButton
          onClick={() => setErrorOverlayType('500')}
          className="w-fit rounded-full bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          500
        </RippleButton>
        <RippleButton
          onClick={() => setErrorOverlayType('error')}
          className="w-fit rounded-full bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
        >
          Error
        </RippleButton>
      </div>

      <h2 className="mt-4 text-lg">Waiting UI Preview</h2>
      <p className="text-muted-foreground">
        Preview the portrait orientation overlay with Vortex animation. Press
        Escape or click the back button to close.
      </p>
      <RippleButton
        onClick={() => setForceWaitingUI(!forceWaitingUI)}
        className={
          forceWaitingUI
            ? 'w-fit rounded-full bg-red-500 px-4 py-2 text-white hover:bg-red-600'
            : 'w-fit rounded-full bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90'
        }
      >
        {forceWaitingUI ? '關閉等待 UI' : '等待 UI (Portrait)'}
      </RippleButton>
    </div>
  )
}
