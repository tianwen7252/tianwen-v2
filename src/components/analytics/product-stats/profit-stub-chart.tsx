/**
 * ProfitStubChart — placeholder card for the future profit analysis feature.
 * Renders a simple coming-soon message with a construction icon.
 */

import { useTranslation } from 'react-i18next'
import { Construction } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

export function ProfitStubChart() {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">
          {t('analytics.profitAnalysisTitle')}
        </CardTitle>
        <CardDescription>{t('analytics.profitAnalysisDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-muted-foreground">
          <Construction className="h-12 w-12" />
          <p className="text-base">{t('analytics.profitAnalysisDesc')}</p>
        </div>
      </CardContent>
    </Card>
  )
}
