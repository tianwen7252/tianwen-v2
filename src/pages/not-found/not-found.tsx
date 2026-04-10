import { ErrorOverlay } from '@/components/error-ui'

/**
 * Not-found route component.
 * Renders the full-screen ErrorOverlay directly so it works
 * regardless of the router's rendering path for notFoundComponent.
 * No onClose — the URL is genuinely wrong, user navigates via the header.
 */
export function NotFoundPage() {
  return <ErrorOverlay type="404" />
}
