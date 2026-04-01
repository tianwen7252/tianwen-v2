import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmModal, Modal, ModalCard } from '@/components/modal'
import { AvatarImage } from '@/components/avatar-image'
import type { GradientVariant, ShineColor } from '@/components/modal'

type DemoType = 'clockIn' | 'clockOut' | 'vacation' | 'form' | 'loading' | null

const CONFIRM_DEMOS: Record<
  'clockIn' | 'clockOut' | 'vacation',
  {
    title: string
    variant: GradientVariant
    confirmText: string
    shineColor: ShineColor
  }
> = {
  clockIn: {
    title: '確認 Alex 的上班打卡？',
    variant: 'green',
    confirmText: '確認打卡',
    shineColor: 'green',
  },
  clockOut: {
    title: '確認 Alex 的下班打卡？',
    variant: 'warm',
    confirmText: '確認下班',
    shineColor: 'purple',
  },
  vacation: {
    title: '確認 Alex 的休假打卡？',
    variant: 'red',
    confirmText: '確認休假',
    shineColor: 'red',
  },
}

export function ModalPreview() {
  const [activeDemo, setActiveDemo] = useState<DemoType>(null)

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Modal / ModalCard / ConfirmModal — 支援 Confirm / Form / Loading /
        自訂內容。
      </p>

      {/* ConfirmModal demos */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">ConfirmModal (確認模式)</h2>
        <div className="flex gap-3">
          <Button variant="default" onClick={() => setActiveDemo('clockIn')}>
            上班打卡
          </Button>
          <Button variant="secondary" onClick={() => setActiveDemo('clockOut')}>
            下班打卡
          </Button>
          <Button
            variant="destructive"
            onClick={() => setActiveDemo('vacation')}
          >
            休假打卡
          </Button>
        </div>
      </section>

      {/* Other demos */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">其他模式</h2>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setActiveDemo('form')}>
            Form Modal
          </Button>
          <Button variant="outline" onClick={() => setActiveDemo('loading')}>
            Loading Modal
          </Button>
        </div>
      </section>

      {/* ConfirmModal — content as children */}
      {activeDemo && activeDemo !== 'form' && activeDemo !== 'loading' && (
        <ConfirmModal
          open
          {...CONFIRM_DEMOS[activeDemo]}
          onConfirm={() => setActiveDemo(null)}
          onCancel={() => setActiveDemo(null)}
        >
          <ModalCard>
            <div
              style={{
                borderRadius: '50%',
                overflow: 'hidden',
                display: 'inline-flex',
                marginBottom: 12,
              }}
            >
              <AvatarImage avatar="/images/aminals/tiger.png" size={120} />
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#1a202c',
                marginBottom: 4,
              }}
            >
              Alex
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#7f956a',
                marginBottom: 8,
              }}
            >
              管理員
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
                width: '100%',
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px solid #e2e8f0',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#718096',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 4,
                    textAlign: 'center',
                  }}
                >
                  目前時間
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#1a202c',
                    textAlign: 'center',
                  }}
                >
                  09:30 AM
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#718096',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 4,
                    textAlign: 'center',
                  }}
                >
                  班別類型
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#1a202c',
                    textAlign: 'center',
                  }}
                >
                  正常班
                </div>
              </div>
            </div>
          </ModalCard>
        </ConfirmModal>
      )}

      {/* Form Modal */}
      {activeDemo === 'form' && (
        <Modal
          open
          variant="green"
          shineColor="green"
          header="員工資料"
          title="編輯員工資訊"
          onClose={() => setActiveDemo(null)}
          footer={
            <div className="flex w-full justify-center gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setActiveDemo(null)}
              >
                取消
              </Button>
              <Button className="flex-1" onClick={() => setActiveDemo(null)}>
                儲存
              </Button>
            </div>
          }
        >
          <ModalCard>
            <div
              style={{
                borderRadius: '50%',
                overflow: 'hidden',
                display: 'inline-flex',
                marginBottom: 12,
              }}
            >
              <AvatarImage avatar="/images/aminals/puppy.png" size={120} />
            </div>
            <div className="w-full space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  姓名
                </label>
                <input
                  type="text"
                  defaultValue="Alex"
                  className="w-full rounded-lg border border-input bg-white/60 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  員工編號
                </label>
                <input
                  type="text"
                  defaultValue="001"
                  className="w-full rounded-lg border border-input bg-white/60 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  班別
                </label>
                <select className="w-full rounded-lg border border-input bg-white/60 px-3 py-2 text-sm">
                  <option>正常班</option>
                  <option>輪班</option>
                </select>
              </div>
            </div>
          </ModalCard>
        </Modal>
      )}

      {/* Loading Modal */}
      {activeDemo === 'loading' && (
        <ConfirmModal
          open
          variant="green"
          shineColor="green"
          title="處理中..."
          confirmText="確認"
          loading
          onConfirm={() => {}}
          onCancel={() => setActiveDemo(null)}
        >
          <ModalCard>
            <div
              style={{
                borderRadius: '50%',
                overflow: 'hidden',
                display: 'inline-flex',
                marginBottom: 12,
              }}
            >
              <AvatarImage avatar="/images/aminals/tiger.png" size={120} />
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#1a202c',
                marginBottom: 4,
              }}
            >
              Alex
            </div>
            <div
              style={{
                fontSize: 13,
                color: '#718096',
                marginTop: 12,
                textAlign: 'center',
              }}
            >
              正在處理打卡資料，請稍候...
            </div>
          </ModalCard>
        </ConfirmModal>
      )}
    </div>
  )
}
