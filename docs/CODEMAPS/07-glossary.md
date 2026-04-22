# Tianwen V2 Domain Vocabulary

**Last Updated:** 2026-04-11

Traditional Chinese (zh-TW) ↔ English glossary of all domain-specific terms used in Tianwen V2. Extracted from `src/locales/zh-TW.json` and codebase.

---

## Navigation & Page Labels

| English Key | Traditional Chinese | Usage                             | Context                   |
| ----------- | ------------------- | --------------------------------- | ------------------------- |
| home        | 點餐                | Order entry page                  | Main tab                  |
| clockIn     | 打卡                | Staff time tracking               | Main tab                  |
| records     | 打卡記錄            | Attendance history                | Main tab                  |
| staffAdmin  | 員工管理            | Employee management               | Settings sub-tab          |
| settings    | 設定                | App settings & configuration      | Main tab                  |
| orders      | 訂單                | Order history                     | Main tab                  |
| analytics   | 統計                | Dashboard & KPIs                  | Main tab                  |
| appTitle    | 天文精緻便當        | "Tianwen Deluxe Bento" (app name) | Browser title, homescreen |

---

## Order Entry (Category & Item Labels)

| English Key      | Traditional Chinese | Code Name  | Color            | Purpose                    |
| ---------------- | ------------------- | ---------- | ---------------- | -------------------------- |
| categoryStall    | 攤位                | `stall`    | Red (#FF6B6B)    | Side items (auto-memo tag) |
| categoryBento    | 餐盒                | `bento`    | Green (#51CF66)  | Bento boxes with sides     |
| categorySingle   | 單點                | `single`   | Brown (#A05A2C)  | À-la-carte items           |
| categoryDrink    | 飲料                | `drink`    | Indigo (#7C3AED) | Beverages                  |
| categoryDumpling | 水餃                | `dumpling` | Indigo (#7C3AED) | Dumplings                  |

**Auto-Memo Tag**: When user adds item from `categoryStall` (攤位), order memo automatically includes `"攤位"` tag (Rule 1).

**Example Items**:

- Stall: 蚵仔煎 (oyster omelette), 滷蛋 (braised egg)
- Bento: 豬肉排便當 (pork chop bento), 雞腿便當 (chicken leg bento)
- Single: 豆干 (tofu), 海帶 (seaweed)
- Drink: 青茶 (green tea), 烏龍茶 (oolong tea)

---

## Clock-In & Time Tracking

| English Key    | Traditional Chinese | Usage             | Context               |
| -------------- | ------------------- | ----------------- | --------------------- |
| clockIn        | 打卡上班            | Start shift       | Button in ClockInPage |
| clockOut       | 打卡下班            | End shift         | Button in ClockInPage |
| applyVacation  | 休假                | Request leave     | Button option         |
| cancelVacation | 取消休假            | Cancel leave      | Undo option           |
| hoursWorked    | 工時                | Hours calculation | Records page          |

**Vacation Types**:
| English | Traditional Chinese | Type Code | Meaning |
|---|---|---|---|
| Regular (working) | 一般 | `regular` | Normal working day |
| Paid Leave | 特休 | `paid_leave` | Paid vacation (annual, etc.) |
| Sick Leave | 病假 | `sick_leave` | Medical/health leave |
| Personal Leave | 事假 | `personal_leave` | Personal business leave |
| Absent | 缺勤 | `absent` | No-show / absent |

---

## Staff Management

| English Key     | Traditional Chinese | Usage                    | Context                   |
| --------------- | ------------------- | ------------------------ | ------------------------- |
| employeeNo      | 員工編號            | Staff ID (e.g., EMP-001) | Database field            |
| hireDate        | 入職日期            | Start date (ISO format)  | Employee profile          |
| resignationDate | 離職日期            | End date when terminated | Employee profile          |
| shiftType       | 班別                | Shift scheduling mode    | Employee profile          |
| admin           | 管理員              | Administrator role       | Permission flag           |
| active          | 上班                | Employee is active       | Status flag               |
| inactive        | 離職                | Employee terminated      | Status flag (soft-delete) |

**Shift Types**:
| English | Traditional Chinese | Code | Meaning |
|---|---|---|---|
| Regular | 常日班 | `regular` | Fixed daily shift |
| Rotating | 排班 | `shift` | Rotating/flexible schedule |

**Avatar Animals** (V2-176 migration renamed numeric → English):

- doberman, poodle, bulldog, husky, german-shepherd, golden-retriever, labrador, corgi
- (Emoji PNG filenames for visual identification)

---

## Settings & Configuration

| English Key      | Traditional Chinese | Usage                               | Context          |
| ---------------- | ------------------- | ----------------------------------- | ---------------- |
| deviceName       | 裝置代號            | Device identifier                   | Settings display |
| cloudBackup      | 雲端備份狀態        | Cloud backup status                 | Settings section |
| backupNow        | 立即備份            | Manual backup trigger               | Button           |
| restoreFromCloud | 從雲端復原          | Cloud restore                       | Button           |
| backupSchedule   | 備份排程            | Backup frequency preference         | Settings option  |
| noBackup         | 不備份              | Never backup                        | Schedule choice  |
| dailyBackup      | 每日備份            | Daily backup                        | Schedule choice  |
| weeklyBackup     | 每週備份            | Weekly backup (Monday)              | Schedule choice  |
| lastBackupTime   | 最後備份時間        | Timestamp of last successful backup | Display          |

**Google OAuth**:
| English | Traditional Chinese | Usage |
|---|---|---|
| linkGoogle | 連結 Google 帳號 | Bind employee to Google account |
| unlinkGoogle | 解除連結 | Unbind Google account |
| connected | 已連結 | Shows bound email |
| googleEmail | Google 電子郵件 | Bound email address |

---

## Order Management

| English Key       | Traditional Chinese | Usage                              | Context                  |
| ----------------- | ------------------- | ---------------------------------- | ------------------------ |
| orderNumber       | 單號                | Sequential order number (1, 2, 3…) | Receipt, display         |
| orderTotal        | 總金額              | Final amount after discounts       | Display                  |
| originalTotal     | 原始金額            | Pre-discount total                 | Audit trail              |
| discountAmount    | 折扣金額            | Discount value                     | Display                  |
| memberDiscount    | 會員折扣            | Member discount (example)          | Discount label           |
| earlyBirdDiscount | 早鳥折扣            | Early bird discount (example)      | Discount label           |
| memo              | 備註                | Order notes/tags (JSON array)      | Order field              |
| editedMemo        | 編輯備註            | Human-editable memo                | Order field              |
| isServed          | 已上菜              | Order fulfilled/delivered          | Flag; shown as checkmark |
| markAsServed      | 標記為已上菜        | Mark order as fulfilled            | Button                   |
| recent            | 最近訂單            | Today's recent orders              | Section header           |

**Example Order Memo Tags**:

- `["攤位"]` — Contains stall items
- `["攤位", "特餐"]` — Stall items + special meal
- `[]` — No special tags

---

## Product Management

| English Key     | Traditional Chinese | Usage                   | Context       |
| --------------- | ------------------- | ----------------------- | ------------- |
| productName     | 產品名稱            | Commodity name          | Field         |
| currentPrice    | 目前售價            | Current price           | Display       |
| previousPrice   | 前一個售價          | Price before edit       | History       |
| priceChange     | 價格調整            | Price modification      | Audit entry   |
| onMarket        | 上架                | Item available for sale | Status flag   |
| offMarket       | 下架                | Item hidden/unavailable | Status flag   |
| includesSoup    | 含湯                | Bento includes soup     | Boolean flag  |
| excludesSoup    | 不含湯              | Bento without soup      | Opposite flag |
| productCategory | 產品類別            | Commodity type/category | Grouping      |

**Price Edit Workflow**:

- User edits commodity price: 100 → 120
- System creates `price_change_logs` entry:
  - `old_price`: 100
  - `new_price`: 120
  - `editor`: admin name
  - `created_at`: timestamp
- Future orders see new price (120)
- Old orders retain snapshot price (100)

---

## Analytics & Reporting

| English Key         | Traditional Chinese | Usage                              | Context         |
| ------------------- | ------------------- | ---------------------------------- | --------------- |
| totalRevenue        | 總營收              | Sum of all order totals            | KPI             |
| dailyRevenue        | 日營收              | Sum per date                       | Daily aggregate |
| productSalesRanking | 產品銷售排名        | Top items by quantity              | Chart           |
| staffPerformance    | 員工績效            | Orders per employee                | Chart           |
| hourlyBucket        | 時段營收            | Revenue by hour-of-day             | Chart           |
| amRevenue           | 上午營收            | Morning revenue (e.g., 6am–12pm)   | Metric          |
| pmRevenue           | 下午營收            | Afternoon revenue (e.g., 12pm–6pm) | Metric          |
| quantity            | 數量                | Number of items sold               | Chart axis      |
| revenue             | 營收                | Amount in TWD                      | Chart axis      |

---

## Error Messages & Recovery

| English Key          | Traditional Chinese  | Usage                             | Context                      |
| -------------------- | -------------------- | --------------------------------- | ---------------------------- |
| error                | 錯誤                 | Generic error                     | Modal title                  |
| errorOccurred        | 發生錯誤             | An error happened                 | Message                      |
| retry                | 重試                 | Retry operation                   | Button                       |
| goHome               | 回首頁               | Navigate to home                  | Button                       |
| reload               | 重新載入             | Reload app                        | Button                       |
| ok                   | 確定                 | Confirm                           | Button                       |
| cancel               | 取消                 | Cancel                            | Button                       |
| confirm              | 確認                 | Confirm action                    | Button                       |
| delete               | 刪除                 | Delete item                       | Button                       |
| edit                 | 編輯                 | Edit item                         | Button                       |
| save                 | 儲存                 | Save changes                      | Button                       |
| close                | 關閉                 | Close dialog                      | Button                       |
| pleaseTurnDevice     | 請將裝置轉為橫向使用 | Please rotate device to landscape | Portrait enforcement message |
| initializingDatabase | 初始化資料庫中       | Initializing database             | InitOverlay message          |
| backingUp            | 備份中               | Backup in progress                | WaitingOverlay message       |
| restoringDatabase    | 復原資料庫中         | Restoring database                | WaitingOverlay message       |

---

## Backup & Backup Logs

| English Key    | Traditional Chinese | Usage                                            | Context  |
| -------------- | ------------------- | ------------------------------------------------ | -------- |
| backupType     | 備份類型            | Category of backup                               | Field    |
| manualBackup   | 手動備份            | User-initiated                                   | Type     |
| autoBackup     | 自動備份            | Scheduled                                        | Type     |
| v1Import       | V1 資料匯入         | Legacy import                                    | Type     |
| backupStatus   | 備份狀態            | Success or failure                               | Field    |
| successful     | 成功                | Backup completed successfully                    | Status   |
| failed         | 失敗                | Backup failed                                    | Status   |
| backupSize     | 備份大小            | Compressed file size in MB                       | Metadata |
| backupDuration | 備份耗時            | Time taken (seconds)                             | Metadata |
| errorMessage   | 錯誤訊息            | Backup failure reason                            | Field    |
| backupFilename | 備份檔案名稱        | e.g., tianwen-ipad-2026-04-11_14-30-00.sqlite.gz | Field    |

**Backup Filename Format**:

```
tianwen-{device-id}-{YYYY-MM-DD_HH-mm-ss}.sqlite.gz

Example: tianwen-iPad-AB12CD-2026-04-11_14-30-00.sqlite.gz
         ↑      ↑        ↑         ↑                   ↑
         app    device   date      time               compression
```

---

## System & Diagnostics

| English Key    | Traditional Chinese | Usage               | Context          |
| -------------- | ------------------- | ------------------- | ---------------- |
| systemInfo     | 系統資訊            | Diagnostics page    | Settings sub-tab |
| appVersion     | 應用程式版本        | Build version       | Display          |
| lastBackupTime | 最後備份時間        | Timestamp           | Display          |
| databaseSize   | 資料庫大小          | SQLite size in MB   | Display          |
| errorLog       | 錯誤日誌            | Error records       | Diagnostics      |
| errorDetails   | 錯誤詳情            | Stack trace, source | Display          |
| diagnostics    | 診斷資訊            | Technical details   | Section          |

---

## Time & Dates

| English Key | Traditional Chinese | Usage                  | Format           |
| ----------- | ------------------- | ---------------------- | ---------------- |
| date        | 日期                | Calendar date          | YYYY-MM-DD (ISO) |
| time        | 時間                | Clock time             | HH:mm (24-hour)  |
| today       | 今天                | Current date           | Display          |
| yesterday   | 昨天                | Previous date          | Display          |
| thisWeek    | 本週                | Current week (Mon–Sun) | Range            |
| thisMonth   | 本月                | Current month          | Range            |
| startDate   | 開始日期            | Range start            | Picker           |
| endDate     | 結束日期            | Range end              | Picker           |
| morning     | 上午                | 6am–12pm               | Time bucket      |
| afternoon   | 下午                | 12pm–6pm               | Time bucket      |

**Taiwan Timezone**: All dates/times use Taiwan timezone (UTC+8). Backup scheduling respects Taiwan midnight, not UTC.

---

## Currencies & Units

| Item          | Value        | Usage                  |
| ------------- | ------------ | ---------------------- |
| Currency      | 台幣 (TWD)   | Order totals, prices   |
| Symbol        | $            | Display (implicit TWD) |
| Size (Backup) | MB           | File size (gzipped)    |
| Duration      | 秒 (seconds) | Backup duration        |
| Count         | 件 (items)   | Quantity of products   |

**Price Examples**:

- 豬肉排便當: $150
- 飲料: $30–$50
- Discount: -$50 (represented as positive amount in code)

---

## Business Rules (Naming)

| Rule    | English              | Traditional Chinese   |
| ------- | -------------------- | --------------------- |
| Rule 1  | Stall auto-memo      | 攤位自動備註          |
| Rule 2  | Taiwan timezone      | 台灣時區              |
| Rule 3  | Backup retention     | 備份保留政策 (max 30) |
| Rule 4  | Snapshot price       | 快照定價              |
| Rule 5  | V1 idempotency       | V1 冪等性             |
| Rule 6  | Employee soft-delete | 員工軟刪除            |
| Rule 7  | Order numbering      | 訂單編號              |
| Rule 8  | Init UI duration     | 初始化 UI 最短時間    |
| Rule 9  | Portrait orientation | 直向模式              |
| Rule 10 | Device identity      | 裝置識別              |
| Rule 11 | No global login      | 無全局登入            |
| Rule 12 | Order edit           | 訂單編輯              |
| Rule 13 | Gzip compression     | Gzip 壓縮             |

---

## Code Terms (Non-Translatable)

| Term             | Definition                | Usage                      |
| ---------------- | ------------------------- | -------------------------- |
| nanoid           | Short unique ID generator | Primary keys (16 chars)    |
| OPFS             | Open File System Access   | Browser persistent storage |
| SQLite WASM      | SQL in WebAssembly        | Client-side database       |
| Web Worker       | Separate JS thread        | Non-blocking DB queries    |
| Presigned URL    | Time-limited S3 URL       | Backup upload/download     |
| R2               | Cloudflare object storage | Backup file storage        |
| Vercel Functions | Serverless Node.js        | Backend API                |
| TanStack Query   | Server state library      | Future API caching         |
| Zustand          | State management          | Session state              |
| TanStack Router  | File-based routing        | App navigation             |
| shadcn/ui        | Radix + Tailwind          | UI components              |
| Recharts         | React charts              | Analytics visualization    |
| i18n             | Internationalization      | Multi-language support     |

---

## Localization Notes

### Traditional Chinese (zh-TW) — Primary

- Use Traditional characters (正體字), not Simplified
- Common units: 台幣 (TWD), 號 (item count), 天 (days)
- Date format: YYYY-MM-DD (ISO standard for databases)
- Time format: 24-hour (HH:mm:ss)
- Week starts Monday (Mon–Sun)
- Right-to-left NOT used (normal LTR text)

### English (en) — Secondary

- Fallback language (partial coverage)
- Used for: error messages, API docs, code comments
- Not yet fully translated; zh-TW is primary

### Timezone

- **Hard-coded**: Taiwan timezone (UTC+8) for all backup calculations
- **Future**: Could be configurable (see open questions in business rules)
- **Key Files**: `src/lib/backup-schedule.ts` (TAIWAN_OFFSET_MS constant)

---

## Translation File

**Primary**: `src/locales/zh-TW.json`

**Structure**:

```json
{
  "navigation": {
    "home": "點餐",
    "clockIn": "打卡",
    "records": "打卡記錄",
    "staffAdmin": "員工管理",
    "settings": "設定",
    "orders": "訂單",
    "analytics": "統計"
  },
  "order": {
    "categoryStall": "攤位",
    "categoryBento": "餐盒",
    "categorySingle": "單點",
    "categoryDrink": "飲料",
    "categoryDumpling": "水餃"
  },
  "clockIn": {
    "clockIn": "打卡上班",
    "clockOut": "打卡下班",
    "applyVacation": "休假"
  },
  ...
}
```

**Usage in Code**:

```typescript
import { useTranslation } from 'react-i18next';

function OrderPage() {
  const { t } = useTranslation();
  return <h1>{t('navigation.home')}</h1>;
}
```

---

## Glossary Usage Tips

- **For UI Text**: Use glossary to match tone/terminology
- **For Code Comments**: Reference English terms
- **For Database**: Keep column names English (schema_snake_case)
- **For Logs/Errors**: Use Traditional Chinese for user-facing, English for diagnostics
- **For File Names**: English only (e.g., `order-repository.ts`, not `訂單-repository.ts`)

---

## Quick Reference

**Most Common Terms**:
| zh-TW | en | Category |
|---|---|---|
| 點餐 | Home | Navigation |
| 訂單 | Order | Entity |
| 備份 | Backup | Operation |
| 設定 | Settings | Navigation |
| 元 | $ | Currency (TWD) |
| 備註 | Memo | Field |
| 打卡 | Clock-In | Operation |

---

## Summary

Tianwen V2 is fully localized for Traditional Chinese (zh-TW) with partial English fallback. All UI text, error messages, and domain labels are translated. Database schema, code comments, and file names remain in English. Backup scheduling explicitly uses Taiwan timezone (UTC+8), reflecting the target market. The glossary ensures consistency across code, tests, and documentation.

---

**See Also**:

- `src/locales/zh-TW.json` — Full translation file
- `src/lib/i18n.ts` — i18n initialization
- [02-entities.md](02-entities.md) — Entity definitions (English terms)
- [03-business-rules.md](03-business-rules.md) — Business rule names (English)
