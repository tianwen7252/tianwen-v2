/**
 * EmployeeForm — form content for the add/edit employee modal.
 * Uses React Hook Form for state management and Zod for validation.
 * Includes name input, shift type radio, admin checkbox, date inputs, and avatar picker.
 */

import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'
import { AvatarImage } from '@/components/avatar-image'
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
      {/* Name input */}
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          {t('staff.name')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder={t('staff.namePlaceholder')}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          {...register('name')}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Shift type radio */}
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          {t('staff.shiftType')}
        </label>
        <div className="flex gap-4">
          {SHIFT_TYPES.map(shift => (
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

      {/* Admin checkbox */}
      <div>
        <label className="flex items-center gap-2">
          <input type="checkbox" {...register('isAdmin')} />
          <span className="text-sm font-medium text-foreground">
            {t('staff.adminPermission')}
          </span>
        </label>
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
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
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
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            {...register('resignationDate')}
          />
        </div>
      )}

      {/* Avatar picker grid */}
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          {t('staff.avatar')}
        </label>
        <div className="grid grid-cols-9 gap-1.5">
          {ANIMAL_AVATARS.map(animal => (
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
              <AvatarImage avatar={animal.path} size={28} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
