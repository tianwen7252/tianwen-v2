import * as React from 'react'

import { cn } from '@/lib/cn'

// ─── Types ───────────────────────────────────────────────────────────────────

interface CardProps extends React.ComponentProps<'div'> {
  /** Show box shadow on the card (default: false) */
  readonly shadow?: boolean
}

interface CardTitleProps extends React.ComponentProps<'div'> {
  /** Custom font size class (e.g., 'text-lg', 'text-xl'). Default: 'text-base' */
  readonly fontSize?: string
}

// ─── Components ──────────────────────────────────────────────────────────────

function Card({ className, shadow = false, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        'flex flex-col gap-2 rounded-xl border bg-card py-6 text-card-foreground',
        shadow && 'shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({
  className,
  fontSize = 'text-base',
  ...props
}: CardTitleProps) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none', fontSize, className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-md text-muted-foreground', className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className,
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-6', className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
