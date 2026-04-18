import { type ReactElement, useEffect, useRef, useState } from 'react'
import { useRouter, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useTutorial } from '@/hooks/use-tutorial'
import { useAnchorRect } from '@/hooks/use-anchor-rect'
import { resolveStep } from '@/lib/tutorial/resolve-step'
import { waitForSelector } from '@/lib/tutorial/wait-for-selector'
import { WAIT_FOR_SELECTOR_TIMEOUT_MS } from '@/lib/tutorial/constants'
import { logError } from '@/lib/error-logger'
import { notify } from '@/components/ui/sonner'
import { SpotlightOverlay } from './spotlight-overlay'
import { StepPopover } from './step-popover'
import type { TutorialDefinition } from '@/lib/tutorial/types'
import type { RunnerPhase } from '@/lib/tutorial/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface TutorialRunnerProps {
  readonly tutorial: TutorialDefinition
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Drives a tutorial from start to finish. Resolves each step's target
 * (navigate, wait for DOM, or show immediately) and renders the spotlight
 * overlay + step popover pair.
 */
export function TutorialRunner({
  tutorial,
}: TutorialRunnerProps): ReactElement | null {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = useRouterState({ select: s => s.location.pathname })

  const { activeStepIndex, complete, abort, next, goTo } = useTutorial()

  const [phase, setPhase] = useState<RunnerPhase>('idle')
  const [targetEl, setTargetEl] = useState<Element | null>(null)

  const rect = useAnchorRect(targetEl)

  // Track the current step's AbortController so we can cancel pending waits.
  const abortRef = useRef<AbortController | null>(null)

  const step = tutorial.steps[activeStepIndex]

  // Complete when we've advanced past the last step.
  useEffect(() => {
    if (step === undefined) {
      complete(tutorial.id)
    }
  }, [step, complete, tutorial.id])

  // Resolve the action for the current step whenever step or pathname changes.
  useEffect(() => {
    if (!step) return

    // Cancel any in-flight wait from a previous step.
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setPhase('idle')
    setTargetEl(null)

    let action
    try {
      action = resolveStep(step, {
        currentPath: pathname,
        querySelector: selector => document.querySelector(selector),
        defaultTimeoutMs: WAIT_FOR_SELECTOR_TIMEOUT_MS,
      })
    } catch (err: unknown) {
      // Authoring error (e.g. empty target / invalid id) — log and fall back
      // to a centered popover rather than letting the throw crash the app.
      const message = err instanceof Error ? err.message : String(err)
      logError(
        `TutorialRunner: resolveStep threw for step "${step.id}": ${message}`,
        'TutorialRunner.resolveStep',
      )
      notify.error(t('tutorial.runner.targetNotFound'))
      setTargetEl(null)
      setPhase('visible')
      return
    }

    if (action.kind === 'navigate') {
      setPhase('navigating')
      router.navigate({ to: action.to })
      // Route arrival is handled by the pathname dependency re-triggering this effect.
      return
    }

    if (action.kind === 'show-centered') {
      setTargetEl(null)
      setPhase('visible')
      return
    }

    if (action.kind === 'show-anchored') {
      const el = document.querySelector(action.selector)
      setTargetEl(el)
      setPhase('visible')
      return
    }

    // wait-for-target
    setPhase('waiting-for-target')
    waitForSelector(action.selector, {
      signal: controller.signal,
      timeoutMs: action.timeoutMs,
    })
      .then(el => {
        if (controller.signal.aborted) return
        setTargetEl(el)
        setPhase('visible')
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        // Abort from our own controller (step changed) — silently ignore.
        if (err instanceof Error && err.message === 'Aborted') return
        // Timeout or other failure — fall back to centered popover and
        // surface a toast so the user knows the highlighted element was
        // not found on this screen.
        const message = err instanceof Error ? err.message : String(err)
        logError(
          `TutorialRunner: waitForSelector failed for "${action.selector}": ${message}`,
          'TutorialRunner.waitForSelector',
        )
        notify.error(t('tutorial.runner.targetNotFound'))
        setTargetEl(null)
        setPhase('visible')
      })

    return () => {
      controller.abort()
    }
  }, [step, pathname, router, t])

  // Escape key → abort tutorial.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') abort()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [abort])

  if (
    !step ||
    phase === 'idle' ||
    phase === 'navigating' ||
    phase === 'waiting-for-target'
  ) {
    return null
  }

  const isLast = activeStepIndex === tutorial.steps.length - 1

  function advanceOrComplete() {
    if (isLast) {
      complete(tutorial.id)
    } else {
      next(tutorial.steps.length)
    }
  }

  function prev() {
    goTo(activeStepIndex - 1)
  }

  return (
    <>
      <SpotlightOverlay
        rect={rect}
        allowInteraction={step.allowInteraction ?? false}
      />
      <StepPopover
        anchor={targetEl}
        placement={step.placement ?? 'auto'}
        title={t(step.titleKey)}
        body={t(step.bodyKey)}
        progress={`${activeStepIndex + 1} / ${tutorial.steps.length}`}
        showPrev={activeStepIndex > 0}
        nextLabel={
          isLast ? t('tutorial.runner.finish') : t('tutorial.runner.next')
        }
        skipLabel={t('tutorial.runner.skip')}
        prevLabel={t('tutorial.runner.prev')}
        onPrev={prev}
        onNext={advanceOrComplete}
        onSkip={abort}
      />
    </>
  )
}
