import { Button } from '@/components/ui/button'
import { notify } from '@/components/ui/sonner'

export function NotifyPreview() {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Notification Toast — success / error / info / warning variants.
      </p>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Variants</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            className="bg-[#7f956a] text-white hover:bg-[#6b8058]"
            onClick={() => notify.success('訂單已送出')}
          >
            Success
          </Button>
          <Button
            className="bg-[#e06868] text-white hover:bg-[#c85555]"
            onClick={() => notify.error('訂單送出失敗')}
          >
            Error
          </Button>
          <Button
            className="bg-[#5b8def] text-white hover:bg-[#4a7de0]"
            onClick={() => notify.info('請確認資料')}
          >
            Info
          </Button>
          <Button
            className="bg-[#E8C872] text-white hover:bg-[#d49330]"
            onClick={() => notify.warning('庫存不足，請注意')}
          >
            Warning
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">With description</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() =>
              notify.success('訂單已送出', {
                description: '共 3 項，合計 $420',
              })
            }
          >
            Success + desc
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              notify.error('訂單送出失敗', {
                description: '請檢查網路連線後重試',
              })
            }
          >
            Error + desc
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              notify.info('系統通知', {
                description: '新版本已發布，請重新整理頁面',
              })
            }
          >
            Info + desc
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              notify.warning('庫存警告', { description: '炸雞腿飯剩餘 2 份' })
            }
          >
            Warning + desc
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">With time</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => notify.success('打卡上班成功', { showTime: true })}
          >
            Success + time
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              notify.success('打卡下班成功', {
                description: '工時 8h 30m',
                showTime: true,
              })
            }
          >
            Success + desc + time
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Custom duration</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => notify.info('快速提示', { duration: 2000 })}
          >
            2 秒
          </Button>
          <Button variant="outline" onClick={() => notify.success('預設 5 秒')}>
            5 秒 (default)
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              notify.warning('重要警告', {
                description: '請注意此訊息',
                duration: 10000,
              })
            }
          >
            10 秒
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Real-world examples</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => notify.success('打卡上班成功')}
          >
            打卡上班
          </Button>
          <Button
            variant="outline"
            onClick={() => notify.success('打卡下班成功')}
          >
            打卡下班
          </Button>
          <Button
            variant="outline"
            onClick={() => notify.success('員工已新增')}
          >
            新增員工
          </Button>
          <Button
            variant="outline"
            onClick={() => notify.error('操作失敗，請重試')}
          >
            操作失敗
          </Button>
        </div>
      </section>
    </div>
  )
}
