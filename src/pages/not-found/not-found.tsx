import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { FileQuestion } from 'lucide-react'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-12">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
        <FileQuestion className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-4xl text-muted-foreground">404</h1>
        <p className="text-base text-muted-foreground">{t('error.notFound')}</p>
      </div>
      <Link to="/" className="text-primary underline">
        {t('error.backHome')}
      </Link>
    </div>
  )
}
