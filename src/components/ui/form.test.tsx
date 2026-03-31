import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
  useFormField,
} from './form'

// ─── Test Helpers ────────────────────────────────────────────────────────────

const testSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email'),
})

type TestValues = z.infer<typeof testSchema>

/** Wrapper that provides a form context with zodResolver for testing. */
function TestForm({
  onSubmit = vi.fn(),
  defaultValues = { username: '', email: '' },
}: {
  onSubmit?: (values: TestValues) => void
  defaultValues?: Partial<TestValues>
}) {
  const form = useForm<TestValues>({
    resolver: zodResolver(testSchema),
    defaultValues: { username: '', email: '', ...defaultValues },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} data-testid="test-form">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <input {...field} placeholder="Enter username" />
              </FormControl>
              <FormDescription>Your display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <input {...field} placeholder="Enter email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <button type="submit">Submit</button>
      </form>
    </Form>
  )
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Form Components', () => {
  describe('Form (FormProvider wrapper)', () => {
    it('should render children', () => {
      render(<TestForm />)
      expect(screen.getByTestId('test-form')).toBeTruthy()
    })
  })

  describe('FormField', () => {
    it('should render field with label and input', () => {
      render(<TestForm />)
      expect(screen.getByText('Username')).toBeTruthy()
      expect(screen.getByPlaceholderText('Enter username')).toBeTruthy()
    })

    it('should render multiple fields', () => {
      render(<TestForm />)
      expect(screen.getByText('Username')).toBeTruthy()
      expect(screen.getByText('Email')).toBeTruthy()
    })
  })

  describe('FormLabel', () => {
    it('should render as a label element', () => {
      render(<TestForm />)
      const label = screen.getByText('Username')
      expect(label.tagName).toBe('LABEL')
    })

    it('should link to the input via htmlFor', () => {
      render(<TestForm />)
      const label = screen.getByText('Username')
      const htmlFor = label.getAttribute('for')
      expect(htmlFor).toBeTruthy()

      // The input should have the matching id
      const input = screen.getByPlaceholderText('Enter username')
      expect(input.id).toBe(htmlFor)
    })
  })

  describe('FormControl', () => {
    it('should set id on the wrapped input', () => {
      render(<TestForm />)
      const input = screen.getByPlaceholderText('Enter username')
      expect(input.id).toBeTruthy()
    })

    it('should set aria-describedby on the input', () => {
      render(<TestForm />)
      const input = screen.getByPlaceholderText('Enter username')
      const describedBy = input.getAttribute('aria-describedby')
      expect(describedBy).toBeTruthy()
    })

    it('should not set aria-invalid when no error', () => {
      render(
        <TestForm defaultValues={{ username: 'test', email: 'a@b.com' }} />,
      )
      const input = screen.getByPlaceholderText('Enter username')
      expect(input.getAttribute('aria-invalid')).toBeNull()
    })
  })

  describe('FormDescription', () => {
    it('should render helper text', () => {
      render(<TestForm />)
      expect(screen.getByText('Your display name.')).toBeTruthy()
    })

    it('should have the correct id linking to aria-describedby', () => {
      render(<TestForm />)
      const description = screen.getByText('Your display name.')
      const input = screen.getByPlaceholderText('Enter username')
      const describedBy = input.getAttribute('aria-describedby')
      expect(describedBy).toContain(description.id)
    })
  })

  describe('FormMessage', () => {
    it('should not render when there is no error', () => {
      render(<TestForm />)
      // No error messages should be visible
      expect(screen.queryByText('Username is required')).toBeNull()
      expect(screen.queryByText('Invalid email')).toBeNull()
    })

    it('should show validation error on submit with empty required field', async () => {
      const user = userEvent.setup()
      render(<TestForm />)

      await user.click(screen.getByText('Submit'))

      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeTruthy()
      })
    })

    it('should show email validation error', async () => {
      const user = userEvent.setup()
      render(<TestForm />)

      const usernameInput = screen.getByPlaceholderText('Enter username')
      await user.type(usernameInput, 'testuser')

      const emailInput = screen.getByPlaceholderText('Enter email')
      await user.type(emailInput, 'not-an-email')

      await user.click(screen.getByText('Submit'))

      await waitFor(() => {
        expect(screen.getByText('Invalid email')).toBeTruthy()
      })
    })

    it('should set aria-invalid on input when field has error', async () => {
      const user = userEvent.setup()
      render(<TestForm />)

      await user.click(screen.getByText('Submit'))

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Enter username')
        expect(input.getAttribute('aria-invalid')).toBe('true')
      })
    })

    it('should clear error when user provides valid input and re-submits', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<TestForm onSubmit={onSubmit} />)

      // Trigger validation error
      await user.click(screen.getByText('Submit'))
      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeTruthy()
      })

      // Fix the error
      const usernameInput = screen.getByPlaceholderText('Enter username')
      const emailInput = screen.getByPlaceholderText('Enter email')
      await user.type(usernameInput, 'validuser')
      await user.type(emailInput, 'test@example.com')
      await user.click(screen.getByText('Submit'))

      await waitFor(() => {
        expect(screen.queryByText('Username is required')).toBeNull()
        expect(onSubmit).toHaveBeenCalledWith(
          { username: 'validuser', email: 'test@example.com' },
          expect.anything(),
        )
      })
    })
  })

  describe('Integration with zodResolver and zod/v4', () => {
    it('should call onSubmit with valid form data', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<TestForm onSubmit={onSubmit} />)

      await user.type(screen.getByPlaceholderText('Enter username'), 'testuser')
      await user.type(
        screen.getByPlaceholderText('Enter email'),
        'test@example.com',
      )
      await user.click(screen.getByText('Submit'))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledOnce()
        expect(onSubmit).toHaveBeenCalledWith(
          { username: 'testuser', email: 'test@example.com' },
          expect.anything(),
        )
      })
    })

    it('should not call onSubmit when validation fails', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<TestForm onSubmit={onSubmit} />)

      await user.click(screen.getByText('Submit'))

      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeTruthy()
      })
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('useFormField hook', () => {
    it('should throw when used outside FormField context', () => {
      // Suppress error output for expected error
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

      function InvalidComponent() {
        useFormField()
        return <div>Should not render</div>
      }

      expect(() => render(<InvalidComponent />)).toThrow()
      spy.mockRestore()
    })
  })
})
