/**
 * EmployeeForm — form content for the add/edit employee modal.
 * Uses React Hook Form for state management and Zod for validation.
 * Two-column layout: left (name, dates) | divider | right (shift, toggles).
 * Avatar picker at full width bottom.
 */

import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'
import { AvatarImage } from '@/components/avatar-image'
import { Switch } from '@/components/ui/switch'
import { ANIMAL_AVATARS } from '@/constants/animal-avatars'
import { SHIFT_TYPES } from '@/constants/shift-types'
import type { EmployeeFormValues } from '@/lib/form-schemas'

export interface EmployeeFormProps {
  readonly form: UseFormReturn<EmployeeFormValues>
  readonly isEditing: boolean
}

export function EmployeeForm({ form, isEditing }: EmployeeFormProps) {
  const { t } = useTranslation()
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form
  const currentAvatar = watch('avatar')

  return (
    <div className="flex flex-col gap-4">
      {/* Two-column layout */}
      <div className="flex gap-0">
        {/* Left column: name, dates */}
        <div className="flex flex-1 flex-col gap-4 pr-5">
          {/* Name input */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('staff.name')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder={t('staff.namePlaceholder')}
              className="h-10 w-60 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Hire date */}
          <div>
            <label
              htmlFor="hire-date"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              {t('staff.hireDate')}
            </label>
            <input
              id="hire-date"
              type="date"
              className="h-10 w-60 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              {...register('hireDate')}
            />
          </div>

          {/* Resignation date (only when editing) */}
          {isEditing && (
            <div>
              <label
                htmlFor="resignation-date"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                {t('staff.resignationDate')}
              </label>
              <input
                id="resignation-date"
                type="date"
                className="h-10 w-60 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                {...register('resignationDate')}
              />
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px bg-border" />

        {/* Right column: shift, admin, default order staff */}
        <div className="flex flex-1 flex-col gap-4 pl-5">
          {/* Shift type radio */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('staff.shiftType')}
            </label>
            <div className="flex gap-4">
              {SHIFT_TYPES.map((shift) => (
                <label key={shift.key} className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    value={shift.key}
                    {...register('shiftType')}
                  />
                  <span className="text-sm">{shift.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Admin permission toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="is-admin"
              checked={watch('isAdmin')}
              onCheckedChange={(val) => setValue('isAdmin', val)}
              aria-label={t('staff.adminPermission')}
            />
            <label htmlFor="is-admin" className="text-foreground">
              {t('staff.adminPermission')}
            </label>
          </div>

          {/* Default order staff toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="is-default-order-staff"
              checked={watch('isDefaultOrderStaff')}
              onCheckedChange={(val) => setValue('isDefaultOrderStaff', val)}
              aria-label={t('staff.defaultOrderStaff')}
            />
            <label htmlFor="is-default-order-staff" className="text-foreground">
              {t('staff.defaultOrderStaff')}
            </label>
          </div>
        </div>
      </div>

      {/* Avatar picker grid — full width */}
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          {t('staff.avatar')}
        </label>
        <div className="grid grid-cols-9 gap-2">
          {ANIMAL_AVATARS.map((animal) => (
            <button
              key={animal.id}
              type="button"
              data-testid="avatar-option"
              data-selected={currentAvatar === animal.path ? 'true' : 'false'}
              className={`rounded-lg border-2 p-1 transition-colors ${
                currentAvatar === animal.path
                  ? 'border-primary bg-primary/10'
                  : 'border-transparent hover:border-border'
              }`}
              onClick={() => setValue('avatar', animal.path)}
            >
              <AvatarImage avatar={animal.path} size={64} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
