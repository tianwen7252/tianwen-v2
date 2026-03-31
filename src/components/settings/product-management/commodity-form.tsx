/**
 * CommodityForm -- Modal form for add/edit commodity.
 * Uses React Hook Form + Zod for validation.
 * Opens in Modal from @/components/modal.
 */

import { useCallback, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/modal'
import { RippleButton } from '@/components/ui/ripple-button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { commodityFormSchema } from '@/lib/form-schemas'
import type { CommodityFormValues } from '@/lib/form-schemas'
import type { Commodity } from '@/lib/schemas'

export interface CommodityFormProps {
  readonly open: boolean
  readonly commodity: Commodity | null
  readonly onSubmit: (values: CommodityFormValues) => Promise<void>
  readonly onClose: () => void
}

/** Default values for a new commodity form. */
const DEFAULT_VALUES: CommodityFormValues = {
  name: '',
  price: 0,
  includesSoup: false,
}

/** Map a Commodity entity to form values for edit mode. */
function commodityToFormValues(c: Commodity): CommodityFormValues {
  return {
    name: c.name,
    price: c.price,
    includesSoup: c.includesSoup,
  }
}

export function CommodityForm({
  open,
  commodity,
  onSubmit,
  onClose,
}: CommodityFormProps) {
  const { t } = useTranslation()
  const isEditing = commodity !== null

  const form = useForm<CommodityFormValues>({
    resolver: zodResolver(commodityFormSchema),
    defaultValues: isEditing
      ? commodityToFormValues(commodity)
      : DEFAULT_VALUES,
  })

  // Reset form when modal opens or commodity changes
  useEffect(() => {
    if (open) {
      form.reset(isEditing ? commodityToFormValues(commodity!) : DEFAULT_VALUES)
    }
  }, [open, commodity, isEditing, form])

  const handleValidSubmit = useCallback(
    async (values: CommodityFormValues) => {
      await onSubmit(values)
    },
    [onSubmit],
  )

  const handleSubmit = useCallback(() => {
    form.handleSubmit(handleValidSubmit)()
  }, [form, handleValidSubmit])

  const title = isEditing
    ? t('productMgmt.commodities.editProduct')
    : t('productMgmt.commodities.addProduct')

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
          <label htmlFor="commodity-name" className="text-base text-foreground">
            {t('productMgmt.commodities.name')}
          </label>
          <Input
            id="commodity-name"
            {...form.register('name')}
            placeholder={t('productMgmt.commodities.name')}
            className="text-base"
          />
          {form.formState.errors.name && (
            <span className="text-base text-destructive">
              {form.formState.errors.name.message}
            </span>
          )}
        </div>

        {/* Price field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="commodity-price"
            className="text-base text-foreground"
          >
            {t('productMgmt.commodities.price')}
          </label>
          <Input
            id="commodity-price"
            type="number"
            min={0}
            {...form.register('price', { valueAsNumber: true })}
            placeholder="0"
            className="text-base"
          />
          {form.formState.errors.price && (
            <span className="text-base text-destructive">
              {form.formState.errors.price.message}
            </span>
          )}
        </div>

        {/* includesSoup toggle -- label and switch on separate lines */}
        <div className="flex flex-col gap-1.5">
          <span className="text-base text-foreground">
            {t('productMgmt.commodities.includesSoup')}
          </span>
          <Controller
            name="includesSoup"
            control={form.control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
      </div>
    </Modal>
  )
}
