import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import { notify } from '@/components/ui/sonner'
import { Plus } from 'lucide-react'
import { Modal, ConfirmModal } from '@/components/modal'
import { AvatarImage } from '@/components/avatar-image'
import { employeeFormSchema } from '@/lib/form-schemas'
import { getEmployeeRepo } from '@/lib/repositories'
import { useDbQuery } from '@/hooks/use-db-query'
import { useAppStore } from '@/stores/app-store'
import { EmployeeRow } from './employee-row'
import { EmployeeForm } from './employee-form'
import { DEFAULT_VALUES, employeeToFormValues } from './staff-admin.types'
import type { Employee, CreateEmployee } from '@/lib/schemas'
import type { EmployeeFormValues } from '@/lib/form-schemas'

/**
 * StaffAdmin component - Employee management CRUD interface.
 * Renders a table of employees with add/edit/delete/link-Google capabilities.
 * Uses React Hook Form + Zod for form validation.
 */
export function StaffAdmin() {
  const { t } = useTranslation()
  const isAdmin = useAppStore(s => s.isAdmin)
  const googleUser = useAppStore(s => s.googleUser)

  const [refreshKey, setRefreshKey] = useState(0)
  const employees = useDbQuery(
    () => getEmployeeRepo().findAll(),
    [refreshKey],
    [] as Employee[],
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [linkGoogleTarget, setLinkGoogleTarget] = useState<Employee | null>(
    null,
  )
  const [unlinkGoogleTarget, setUnlinkGoogleTarget] = useState<Employee | null>(
    null,
  )

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: DEFAULT_VALUES,
  })

  // Refresh employee list from database
  const refreshEmployees = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  // Open add modal
  const handleAdd = useCallback(() => {
    setEditingEmployee(null)
    form.reset(DEFAULT_VALUES)
    setIsModalOpen(true)
  }, [form])

  // Open edit modal with pre-filled data
  const handleEdit = useCallback(
    (employee: Employee) => {
      setEditingEmployee(employee)
      form.reset(employeeToFormValues(employee))
      setIsModalOpen(true)
    },
    [form],
  )

  // Close the add/edit modal
  const handleClose = useCallback(() => {
    setIsModalOpen(false)
    setEditingEmployee(null)
    form.reset(DEFAULT_VALUES)
  }, [form])

  // Submit form (add or update) — called by handleSubmit on valid data
  const onValidSubmit = useCallback(
    async (values: EmployeeFormValues) => {
      const trimmedName = values.name.trim()
      if (!trimmedName) {
        form.setError('name', {
          type: 'manual',
          message: t('staff.nameRequired'),
        })
        return
      }

      // Clear other employees' default order staff flag if this one is being set
      if (values.isDefaultOrderStaff) {
        const allEmployees = await getEmployeeRepo().findAll()
        for (const emp of allEmployees) {
          if (emp.isDefaultOrderStaff && emp.id !== editingEmployee?.id) {
            await getEmployeeRepo().update(emp.id, {
              isDefaultOrderStaff: false,
            })
          }
        }
      }

      if (editingEmployee) {
        // Update existing employee
        await getEmployeeRepo().update(editingEmployee.id, {
          name: trimmedName,
          avatar: values.avatar || undefined,
          shiftType: values.shiftType ?? 'regular',
          isAdmin: values.isAdmin ?? false,
          isDefaultOrderStaff: values.isDefaultOrderStaff ?? false,
          hireDate: values.hireDate || undefined,
          resignationDate: values.resignationDate || undefined,
          status: values.resignationDate ? 'inactive' : 'active',
        })
        notify.success(t('staff.toastUpdated'))
      } else {
        // Generate next employee number
        const allEmployees = await getEmployeeRepo().findAll()
        const maxNo = allEmployees.reduce((max, e) => {
          const num = parseInt(e.employeeNo?.replace('E', '') ?? '0', 10)
          return num > max ? num : max
        }, 0)
        const employeeNo = `E${String(maxNo + 1).padStart(3, '0')}`

        const newEmployee: CreateEmployee = {
          name: trimmedName,
          avatar: values.avatar || undefined,
          shiftType: values.shiftType ?? 'regular',
          isAdmin: values.isAdmin ?? false,
          isDefaultOrderStaff: values.isDefaultOrderStaff ?? false,
          hireDate: values.hireDate || undefined,
          employeeNo,
          status: 'active',
        }
        await getEmployeeRepo().create(newEmployee)
        notify.success(t('staff.toastAdded'))
      }

      refreshEmployees()
      handleClose()
    },
    [editingEmployee, refreshEmployees, handleClose, form, t],
  )

  // Trigger form validation and submit
  const handleSubmit = useCallback(() => {
    form.handleSubmit(onValidSubmit)()
  }, [form, onValidSubmit])

  // Initiate delete confirmation
  const handleDeleteClick = useCallback((employee: Employee) => {
    setDeleteTarget(employee)
  }, [])

  // Confirm deletion
  const handleDeleteConfirm = useCallback(async () => {
    if (deleteTarget) {
      await getEmployeeRepo().remove(deleteTarget.id)
      refreshEmployees()
      notify.success(t('staff.toastDeleted'))
    }
    setDeleteTarget(null)
  }, [deleteTarget, refreshEmployees, t])

  // Cancel deletion
  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null)
  }, [])

  // Initiate link Google confirmation
  const handleLinkGoogleClick = useCallback((employee: Employee) => {
    setLinkGoogleTarget(employee)
  }, [])

  // Confirm link Google account — admin-only, rejects duplicates
  const handleLinkGoogleConfirm = useCallback(async () => {
    if (!linkGoogleTarget || !googleUser || !isAdmin) return

    // Prevent linking the same Google account to multiple employees
    const allEmployees = await getEmployeeRepo().findAll()
    const alreadyLinked = allEmployees.find(
      e => e.googleSub === googleUser.sub && e.id !== linkGoogleTarget.id,
    )
    if (alreadyLinked) {
      notify.warning(
        t('staff.linkGoogleDuplicate', { name: alreadyLinked.name }),
      )
      setLinkGoogleTarget(null)
      return
    }

    await getEmployeeRepo().bindGoogleAccount(
      linkGoogleTarget.id,
      googleUser.sub,
      googleUser.email,
    )
    notify.success(t('staff.linkGoogleSuccess'))
    refreshEmployees()
    setLinkGoogleTarget(null)
  }, [linkGoogleTarget, googleUser, isAdmin, refreshEmployees, t])

  // Cancel link Google
  const handleLinkGoogleCancel = useCallback(() => {
    setLinkGoogleTarget(null)
  }, [])

  // Initiate unlink Google confirmation
  const handleUnlinkGoogleClick = useCallback((employee: Employee) => {
    setUnlinkGoogleTarget(employee)
  }, [])

  // Confirm unlink Google account — admin-only
  const handleUnlinkGoogleConfirm = useCallback(async () => {
    if (!unlinkGoogleTarget || !isAdmin) return
    await getEmployeeRepo().unbindGoogleAccount(unlinkGoogleTarget.id)
    notify.success(t('staff.unlinkGoogleSuccess'))
    refreshEmployees()
    setUnlinkGoogleTarget(null)
  }, [unlinkGoogleTarget, isAdmin, refreshEmployees, t])

  // Cancel unlink Google
  const handleUnlinkGoogleCancel = useCallback(() => {
    setUnlinkGoogleTarget(null)
  }, [])

  return (
    <div className="p-6">
      {/* Header with add button */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-medium">{t('staff.title')}</h3>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          onClick={handleAdd}
        >
          <Plus size={16} />
          {t('staff.addEmployee')}
        </button>
      </div>

      {/* Employee table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-sm text-[#475569]">
                {t('staff.employeeNo')}
              </th>
              <th className="px-4 py-3 text-left text-sm text-[#475569]">
                {t('staff.employee')}
              </th>
              <th className="px-4 py-3 text-left text-sm text-[#475569]">
                {t('staff.hireDate')}
              </th>
              <th className="px-4 py-3 text-left text-sm text-[#475569]">
                {t('staff.resignationDate')}
              </th>
              <th className="px-4 py-3 text-left text-sm text-[#475569]">
                {t('staff.shiftType')}
              </th>
              <th className="px-4 py-3 text-left text-sm text-[#475569]">
                {t('staff.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => (
              <EmployeeRow
                key={employee.id}
                employee={employee}
                isCurrentUserAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onLinkGoogle={handleLinkGoogleClick}
                onUnlinkGoogle={handleUnlinkGoogleClick}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        width={860}
        open={isModalOpen}
        title={
          editingEmployee ? t('staff.editEmployee') : t('staff.addEmployee')
        }
        variant={editingEmployee ? 'warm' : 'green'}
        shineColor={editingEmployee ? 'purple' : 'green'}
        onClose={handleClose}
        footer={
          <div className="flex justify-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-border px-6 py-2 text-md text-muted-foreground hover:bg-accent"
              onClick={handleClose}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="rounded-lg bg-primary px-6 py-2 text-md text-primary-foreground hover:bg-primary/90"
              onClick={handleSubmit}
            >
              {t('common.confirm')}
            </button>
          </div>
        }
      >
        <EmployeeForm form={form} isEditing={!!editingEmployee} />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title={t('staff.confirmDeleteTitle')}
        variant="red"
        shineColor="red"
        confirmText={t('staff.confirmDelete')}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      >
        {deleteTarget && (
          <div className="flex flex-col items-center gap-2">
            <AvatarImage avatar={deleteTarget.avatar} size={48} />
            <p className="text-sm text-foreground">
              {t('staff.confirmDeleteMessage', { name: deleteTarget.name })}
            </p>
          </div>
        )}
      </ConfirmModal>

      {/* Link Google Confirmation Modal */}
      <ConfirmModal
        open={!!linkGoogleTarget}
        title={t('staff.linkGoogleConfirmTitle')}
        variant="blue"
        shineColor="blue"
        onConfirm={handleLinkGoogleConfirm}
        onCancel={handleLinkGoogleCancel}
      >
        {linkGoogleTarget && (
          <div className="flex flex-col items-center gap-2">
            <AvatarImage avatar={linkGoogleTarget.avatar} size={48} />
            <p className="text-center text-md text-foreground">
              {t('staff.linkGoogleConfirmMessage', {
                employeeName: linkGoogleTarget.name,
                googleName: googleUser?.name ?? googleUser?.email ?? '',
              })}
            </p>
          </div>
        )}
      </ConfirmModal>

      {/* Unlink Google Confirmation Modal */}
      <ConfirmModal
        open={!!unlinkGoogleTarget}
        title={t('staff.unlinkGoogleConfirmTitle')}
        variant="red"
        shineColor="red"
        onConfirm={handleUnlinkGoogleConfirm}
        onCancel={handleUnlinkGoogleCancel}
      >
        {unlinkGoogleTarget && (
          <div className="flex flex-col items-center gap-2">
            <AvatarImage avatar={unlinkGoogleTarget.avatar} size={48} />
            <p className="text-center text-md text-foreground">
              {t('staff.unlinkGoogleConfirmMessage', {
                employeeName: unlinkGoogleTarget.name,
              })}
            </p>
          </div>
        )}
      </ConfirmModal>
    </div>
  )
}
