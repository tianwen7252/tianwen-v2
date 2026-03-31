/**
 * Form components wrapping React Hook Form with shadcn/ui patterns.
 * Provides FormField, FormItem, FormLabel, FormControl, FormMessage,
 * FormDescription, and useFormField hook for building validated forms.
 */

import * as React from 'react'
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'

import { cn } from '@/lib/cn'
import { Label } from '@/components/ui/label'

// ─── Form (FormProvider wrapper) ─────────────────────────────────────────────

const Form = FormProvider

// ─── FormFieldContext ────────────────────────────────────────────────────────

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  readonly name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  const contextValue = React.useMemo(() => ({ name: props.name }), [props.name])
  return (
    <FormFieldContext.Provider value={contextValue}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

// ─── FormItemContext ─────────────────────────────────────────────────────────

interface FormItemContextValue {
  readonly id: string
}

const FormItemContext = React.createContext<FormItemContextValue | null>(null)

// ─── useFormField ────────────────────────────────────────────────────────────

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  if (!fieldContext) {
    throw new Error('useFormField must be used within a <FormField>')
  }

  const fieldState = getFieldState(fieldContext.name, formState)
  const id = itemContext?.id ?? ''

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

// ─── FormItem ────────────────────────────────────────────────────────────────

function FormItem({ className, ...props }: React.ComponentProps<'div'>) {
  const id = React.useId()
  const contextValue = React.useMemo(() => ({ id }), [id])

  return (
    <FormItemContext.Provider value={contextValue}>
      <div
        data-slot="form-item"
        className={cn('grid gap-2', className)}
        {...props}
      />
    </FormItemContext.Provider>
  )
}

// ─── FormLabel ───────────────────────────────────────────────────────────────

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  const { error, formItemId } = useFormField()

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn(error && 'text-destructive', className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}

// ─── FormControl ─────────────────────────────────────────────────────────────

function FormControl({ ...props }: React.ComponentProps<'div'>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  // Build aria-describedby from description + message ids
  const describedByParts = [formDescriptionId]
  if (error) {
    describedByParts.push(formMessageId)
  }
  const ariaDescribedBy = describedByParts.join(' ')

  // Clone the child element and inject the aria props
  const child = React.Children.only(props.children)

  if (!React.isValidElement(child)) {
    return child as React.ReactNode
  }

  const childProps = (child as React.ReactElement<Record<string, unknown>>)
    .props
  return React.cloneElement(
    child as React.ReactElement<Record<string, unknown>>,
    {
      ...childProps,
      id: formItemId,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': error ? true : undefined,
    },
  )
}

// ─── FormDescription ─────────────────────────────────────────────────────────

function FormDescription({ className, ...props }: React.ComponentProps<'p'>) {
  const { formDescriptionId } = useFormField()

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

// ─── FormMessage ─────────────────────────────────────────────────────────────

function FormMessage({
  className,
  children,
  ...props
}: React.ComponentProps<'p'>) {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn('text-destructive text-sm', className)}
      {...props}
    >
      {body}
    </p>
  )
}

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
}
