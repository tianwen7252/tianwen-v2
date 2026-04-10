import { useTranslation } from 'react-i18next'
import { useInitStore } from '@/stores/init-store'
import { RippleButton } from '@/components/ui/ripple-button'

export function InitUiPreview() {
  const { t } = useTranslation()
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
          onClick={() => setErrorOverlayType('error')}
          className="w-fit rounded-full bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
        >
          Error
        </RippleButton>
      </div>

      <h2 className="mt-4 text-lg">Error Overlay — Integrated Scenarios</h2>
      <p className="text-muted-foreground">
        Simulate real error scenarios that trigger the Error Overlay.
      </p>
      <div className="flex flex-wrap gap-3">
        <RippleButton
          onClick={() =>
            setErrorOverlayType('error', t('error.databaseLocked'))
          }
          className="w-fit rounded-full bg-red-700 px-4 py-2 text-white hover:bg-red-800"
        >
          DB 鎖定
        </RippleButton>
        <RippleButton
          onClick={() => setErrorOverlayType('error', 'SQLite WASM 初始化失敗')}
          className="w-fit rounded-full bg-red-700 px-4 py-2 text-white hover:bg-red-800"
        >
          Bootstrap 失敗
        </RippleButton>
        <RippleButton
          onClick={() =>
            setErrorOverlayType(
              'error',
              'TypeError: Cannot read properties of undefined (reading "map") at OrderPanel.tsx:142:18, triggered while rendering the cart items during checkout. This usually means the order data is still loading or the commodity type map has not been initialized. Please refresh the page or contact support.',
            )
          }
          className="w-fit rounded-full bg-red-700 px-4 py-2 text-white hover:bg-red-800"
        >
          React Render Error
        </RippleButton>
        <RippleButton
          onClick={() =>
            setErrorOverlayType('error', 'Unhandled promise rejection')
          }
          className="w-fit rounded-full bg-red-700 px-4 py-2 text-white hover:bg-red-800"
        >
          Unhandled Rejection
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
