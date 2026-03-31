/**
 * OrderTypeForm -- Modal form for add/edit order type.
 * Uses React Hook Form + Zod for validation.
 * Color picker as clickable pills.
 */

import { useCallback, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/modal'
import { RippleButton } from '@/components/ui/ripple-button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/cn'
import { orderTypeFormSchema } from '@/lib/form-schemas'
import type { OrderTypeFormValues } from '@/lib/form-schemas'
import type { OrderType } from '@/lib/schemas'

// ── Types ──────────────────────────────────────────────────────────────────

export interface OrderTypeFormProps {
  readonly open: boolean
  readonly orderType: OrderType | null
  readonly onSubmit: (values: OrderTypeFormValues) => Promise<void>
  readonly onClose: () => void
}

// ── Color options ──────────────────────────────────────────────────────────

interface ColorOption {
  readonly value: string
  readonly i18nKey: string
  /** CSS color value using theme variables */
  readonly color: string
}

const COLOR_OPTIONS: readonly ColorOption[] = [
  {
    value: '',
    i18nKey: 'productMgmt.orderTypes.colorNone',
    color: '#e5e7eb',
  },
  {
    value: 'green',
    i18nKey: 'productMgmt.orderTypes.colorGreen',
    color: 'var(--color-green)',
  },
  {
    value: 'blue',
    i18nKey: 'productMgmt.orderTypes.colorBlue',
    color: 'var(--color-blue)',
  },
  {
    value: 'yellow',
    i18nKey: 'productMgmt.orderTypes.colorYellow',
    color: 'var(--color-yellow)',
  },
  {
    value: 'red',
    i18nKey: 'productMgmt.orderTypes.colorRed',
    color: 'var(--color-red)',
  },
  {
    value: 'purple',
    i18nKey: 'productMgmt.orderTypes.colorPurple',
    color: '#9333ea',
  },
  {
    value: 'gray',
    i18nKey: 'productMgmt.orderTypes.colorGray',
    color: '#9ca3af',
  },
]

// ── Defaults ───────────────────────────────────────────────────────────────

const DEFAULT_VALUES: OrderTypeFormValues = {
  name: '',
  color: '',
}

/** Map an OrderType entity to form values for edit mode. */
function orderTypeToFormValues(ot: OrderType): OrderTypeFormValues {
  return {
    name: ot.name,
    color: ot.color ?? '',
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export function OrderTypeForm({
  open,
  orderType,
  onSubmit,
  onClose,
}: OrderTypeFormProps) {
  const { t } = useTranslation()
  const isEditing = orderType !== null

  const form = useForm<OrderTypeFormValues>({
    resolver: zodResolver(orderTypeFormSchema),
    defaultValues: isEditing
      ? orderTypeToFormValues(orderType)
      : DEFAULT_VALUES,
  })

  // Reset form when modal opens or orderType changes
  useEffect(() => {
    if (open) {
      form.reset(isEditing ? orderTypeToFormValues(orderType!) : DEFAULT_VALUES)
    }
  }, [open, orderType, isEditing, form])

  const handleValidSubmit = useCallback(
    async (values: OrderTypeFormValues) => {
      await onSubmit(values)
    },
    [onSubmit],
  )

  const handleSubmit = useCallback(() => {
    form.handleSubmit(handleValidSubmit)()
  }, [form, handleValidSubmit])

  const title = isEditing
    ? t('productMgmt.orderTypes.editType')
    : t('productMgmt.orderTypes.addType')

  return (
    <Modal
      open={open}
      title={title}
      variant={isEditing ? 'warm' : 'green'}
      shineColor={isEditing ? 'purple' : 'green'}
      onClose={onClose}
      footer={
        <div className="flex justify-center gap-3">
          <RippleButton
            className="rounded-lg border border-border px-6 py-2 text-base text-muted-foreground hover:bg-accent"
            onClick={onClose}
          >
            {t('common.cancel')}
          </RippleButton>
          <RippleButton
            className="rounded-lg bg-primary px-6 py-2 text-base text-primary-foreground hover:bg-primary/90"
            onClick={handleSubmit}
          >
            {t('common.confirm')}
          </RippleButton>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Name field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="order-type-name"
            className="text-base text-foreground"
          >
            {t('productMgmt.orderTypes.name')}
          </label>
          <Input
            id="order-type-name"
            {...form.register('name')}
            placeholder={t('productMgmt.orderTypes.name')}
            className="text-base"
          />
          {form.formState.errors.name && (
            <span className="text-base text-destructive">
              {form.formState.errors.name.message}
            </span>
          )}
        </div>

        {/* Color picker */}
        <div className="flex flex-col gap-1.5">
          <span className="text-base text-foreground">
            {t('productMgmt.orderTypes.color')}
          </span>
          <Controller
            name="color"
            control={form.control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(opt => (
                  <RippleButton
                    key={opt.value}
                    type="button"
                    data-testid={`color-pill-${opt.value}`}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-base transition-all',
                      field.value === opt.value
                        ? 'ring-2 ring-primary ring-offset-1 bg-accent'
                        : 'bg-muted text-muted-foreground hover:bg-accent',
                    )}
                    onClick={() => field.onChange(opt.value)}
                  >
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: opt.color }}
                    />
                    {t(opt.i18nKey)}
                  </RippleButton>
                ))}
              </div>
            )}
          />
        </div>
      </div>
    </Modal>
  )
}
