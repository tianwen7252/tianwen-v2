// ─── Types ───────────────────────────────────────────────────────────────────

interface ErrorCanvasProps {
  readonly className?: string
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Event Horizon animation — embeds public/error-animation.html via iframe.
 * Same wrapper pattern as InitCanvas (className prop, fills parent).
 */
export function ErrorCanvas({ className }: ErrorCanvasProps) {
  return (
    <div
      className={className}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <iframe
        src="/error-animation.html"
        title="Error Animation"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          border: 'none',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
