# Changelog

## [2.13.1](https://github.com/tianwen7252/tianwen-v2/compare/v2.13.0...v2.13.1) (2026-04-26)


### Bug Fixes

* **clock-in:** resolve cross-day duplicate clock-in and stale-data bugs (V2-251) ([8bbdfe6](https://github.com/tianwen7252/tianwen-v2/commit/8bbdfe630481d9c148aafd10fb86a50dde2ddbdc))

## [2.13.0](https://github.com/tianwen7252/tianwen-v2/compare/v2.12.0...v2.13.0) (2026-04-24)


### Features

* **backup:** force-refetch backup list after manual backup + skeletonize all cloud-backup loading UI ([8e33cdd](https://github.com/tianwen7252/tianwen-v2/commit/8e33cdd0a6667778e443d1e19c75982db6b5cc27))
* **backup:** refresh history after manual backup + skeleton loading state ([bcc3588](https://github.com/tianwen7252/tianwen-v2/commit/bcc35880e5af2a9055788db25e64b2afe5aa49ee))
* **tutorial:** add coachmark component, a11y polish, Playwright E2E (V2-245) ([c9bb9ce](https://github.com/tianwen7252/tianwen-v2/commit/c9bb9ce0fa78b856c0cc523b1934d6d9dc15346d))
* **tutorial:** add header launcher button and tutorial index modal (V2-242) ([ebb9555](https://github.com/tianwen7252/tianwen-v2/commit/ebb9555642765fd11a028311567b2bb8b08afad6))
* **tutorial:** add spotlight overlay and step popover primitives (V2-240) ([b29aece](https://github.com/tianwen7252/tianwen-v2/commit/b29aecede53c71d9fbdf5df0736db4f4fbb5aa64))
* **tutorial:** add tutorial engine infrastructure (V2-239) ([e6b1e3c](https://github.com/tianwen7252/tianwen-v2/commit/e6b1e3c07f412b2e18a2bcedead1a4cc8ee40ef7))
* **tutorial:** add tutorial runner engine with route integration (V2-241) ([1f0b031](https://github.com/tianwen7252/tianwen-v2/commit/1f0b0311984d7fd1dae0273b943e5c87c9150aec))
* **tutorial:** author chapters 20/30/40/90 tour content (V2-244) ([36a6b87](https://github.com/tianwen7252/tianwen-v2/commit/36a6b87ee3e87608b9bc97e9cd6a532a57172b1f))
* **tutorial:** author first-setup and order-basics tours (V2-243) ([cc142ed](https://github.com/tianwen7252/tianwen-v2/commit/cc142edb6f7019fd398e549e790fe37442bd7f03))


### Bug Fixes

* **backup:** only show backup list skeleton during post-backup refetch ([e4a06c4](https://github.com/tianwen7252/tianwen-v2/commit/e4a06c4a9ea5243c780965f3b74332df2b68bcac))
* **backup:** show skeleton immediately on manual backup click ([7ec11d2](https://github.com/tianwen7252/tianwen-v2/commit/7ec11d25d80e0e670a720c747d485f5e5d2e738f))

## [2.12.0](https://github.com/tianwen7252/tianwen-v2/compare/v2.11.0...v2.12.0) (2026-04-17)

### Features

- 統一班次營收計算 + 統計頁面 KPI 重構 + dev 結帳工具 ([feb6a65](https://github.com/tianwen7252/tianwen-v2/commit/feb6a65f366517a899e2a9f4d59617aa29faf4cf))

### Bug Fixes

- resolve readonly tuple type error in shine color presets ([81ee058](https://github.com/tianwen7252/tianwen-v2/commit/81ee05825aba2b61300561a33d8d65ced8dfd77b))

## [2.11.0](https://github.com/tianwen7252/tianwen-v2/compare/v2.10.0...v2.11.0) (2026-04-16)

### Features

- **V2-223:** 點餐人員功能 ([#39](https://github.com/tianwen7252/tianwen-v2/issues/39)) ([595c685](https://github.com/tianwen7252/tianwen-v2/commit/595c685484e9509b3512fd95f0d6240079d68765))
- **V2-230:** 櫃台結帳功能 + 結帳記錄 ([#41](https://github.com/tianwen7252/tianwen-v2/issues/41)) ([2ef34a5](https://github.com/tianwen7252/tianwen-v2/commit/2ef34a508fc92aae5019b80dbd78fc2226e481f8))

## [2.10.0](https://github.com/tianwen7252/tianwen-v2/compare/v2.9.0...v2.10.0) (2026-04-11)

### Features

- V2-222 consolidate DB sizes in local panel + collapsible tables ([5d8e8fb](https://github.com/tianwen7252/tianwen-v2/commit/5d8e8fb611fd7464ab7d1e3d116c6bbc463a5b8d))

### Bug Fixes

- prevent auto-backup from running multiple times per day on iPad ([273444b](https://github.com/tianwen7252/tianwen-v2/commit/273444be9eef32b5f002d803539d59de38205f71))
- V2-222 add disabled styling to restore-prev-db button ([02b0279](https://github.com/tianwen7252/tianwen-v2/commit/02b02790e2e1b0c373e6569960fb529e72c42d60))
- V2-222 disable restore button immediately after deleting prev DB ([c447751](https://github.com/tianwen7252/tianwen-v2/commit/c4477516e73cf7cafd296e8eb326cea2b45fe21a))
- V2-222 hide ScrollToTop button while any overlay is mounted ([19ec992](https://github.com/tianwen7252/tianwen-v2/commit/19ec992e4e48ce2825e32f18a6e5fafc39050ca5))
- V2-222 lock document scroll while any overlay is mounted ([cdc3479](https://github.com/tianwen7252/tianwen-v2/commit/cdc3479abd8146b37929e32d852ff53f05d3597a))
- V2-222 rebuild cloud backup import + error logging + prev DB management ([e6f6975](https://github.com/tianwen7252/tianwen-v2/commit/e6f6975ad33a96345712b9a364e1195e190a3251))
- V2-222 render overlays via portal with proper header stacking ([8a38e9b](https://github.com/tianwen7252/tianwen-v2/commit/8a38e9bea65f5301e215a09d995742de58d2e299))
- V2-222 report prev DB size in gzipped bytes to match cloud list ([7a8e9f5](https://github.com/tianwen7252/tianwen-v2/commit/7a8e9f592310cfd1a80e0f25e60eba0f69806f68))
- V2-222 restore gold variant on restore-prev confirm modal ([a581d42](https://github.com/tianwen7252/tianwen-v2/commit/a581d42ed9effdeed72f27f9bb5494ec1404cf3a))

## [2.9.0](https://github.com/tianwen7252/tianwen-v2/compare/v2.8.0...v2.9.0) (2026-04-10)

### Features

- V2-218 add ErrorOverlay with Event Horizon animation ([287d1ac](https://github.com/tianwen7252/tianwen-v2/commit/287d1ac873b71f7541a335897041c76151cb4046))
- V2-218 integrate ErrorOverlay with app error flows + stall category fix ([5fbd253](https://github.com/tianwen7252/tianwen-v2/commit/5fbd25360e74045a0e73c40b032924f5c0ca7400))

### Bug Fixes

- V2-218 integrate ErrorOverlay with app header + faithful shader port ([83f2d78](https://github.com/tianwen7252/tianwen-v2/commit/83f2d783ccf886d7fd586c96573491b433fe6111))
- V2-218 replace iframe with native WebGL canvas + add Waiting UI ([985fb19](https://github.com/tianwen7252/tianwen-v2/commit/985fb1983bda45aff94940398eb1799016d52a99))
- V2-218 use complete error.html shader with proper error checking ([af06c37](https://github.com/tianwen7252/tianwen-v2/commit/af06c376921667bfdd8aaef6473916883ae95c87))
- V2-218 use iframe for error animation instead of porting WebGL ([c182864](https://github.com/tianwen7252/tianwen-v2/commit/c1828643a11c7843b2b83690755310c2cf14b20d))

## [2.8.0](https://github.com/tianwen7252/tianwen-v2/compare/v2.7.0...v2.8.0) (2026-04-09)

### Features

- add menu items, low-carb variants, sticky category tabs & fix restore tests ([490410b](https://github.com/tianwen7252/tianwen-v2/commit/490410b4b025da9927eb11059fb157e81e3fff6f))
- V2-216 快速送單訂單備註 Popover ([#31](https://github.com/tianwen7252/tianwen-v2/issues/31)) ([f052b83](https://github.com/tianwen7252/tianwen-v2/commit/f052b8383c7542b8fc6302dda3c688caa6e3664e))

## [2.7.0](https://github.com/tianwen7252/tianwen-v2/compare/v2.6.0...v2.7.0) (2026-04-08)

### Features

- init UI 全螢幕動畫 + 共用元件化 + dev header 可點擊 (V2-207) ([54d328f](https://github.com/tianwen7252/tianwen-v2/commit/54d328f3df97bc8dcda81959a38693f4cfa475bc))
- V2 備份匯入 + 還原上一版本資料庫 (V2-215) ([794fe87](https://github.com/tianwen7252/tianwen-v2/commit/794fe875164f1cb8825bb0b36dc1bbace5819596))
- 初始化 UI — 先渲染後初始化，改善啟動體驗 (V2-207) ([831d59a](https://github.com/tianwen7252/tianwen-v2/commit/831d59a3cb9cfc9f56d4eb95e02e364d62c3c0d2))
- 啟用 useAutoBackup 於 RootLayout (V2-171) ([445792b](https://github.com/tianwen7252/tianwen-v2/commit/445792bd1522157604197f1c102066d97bed40af))
- 新增「攤位」餐點分類 + 自動備註邏輯 (V2-207) ([1681d4e](https://github.com/tianwen7252/tianwen-v2/commit/1681d4ee565df4a1ab728af82f73fb4e17b94004))
- 裝置代號功能 — R2 devices.json + 備份檔名識別 (V2-206) ([70ab3d3](https://github.com/tianwen7252/tianwen-v2/commit/70ab3d3ee17355a48754654de8223e334a3ca938))

### Bug Fixes

- AppHeader sticky 固定失效 — 移除多餘外層 div ([8e1dbdc](https://github.com/tianwen7252/tianwen-v2/commit/8e1dbdc1c8ca960ef25d048e81e96e37d04ab255))
- CI lint error — unused catch parameter (V2-215) ([f3382d8](https://github.com/tianwen7252/tianwen-v2/commit/f3382d84c8920f70bc2f1414d3bfd28b38ed288e))
- flaky overlay delay test — VITEST 環境下 MIN_OVERLAY_MS=0 ([9b91639](https://github.com/tianwen7252/tianwen-v2/commit/9b9163924febecd102cba91f1b129ee920be13ca))
- init UI 改善 — shadcn spinner、backdrop 調色、水波紋下移 (V2-207) ([9f521c1](https://github.com/tianwen7252/tianwen-v2/commit/9f521c1f71a6c4bfd37620be823bd25393f914a7))
- InitOverlay 至少顯示 5 秒讓動畫跑完 (V2-215) ([f34b9cf](https://github.com/tianwen7252/tianwen-v2/commit/f34b9cf120748f6681222a631ec63e9ec61512fc))
- lint error — ripples 改為 const（不再被 reassign） ([d0315f7](https://github.com/tianwen7252/tianwen-v2/commit/d0315f79a0ff26ab8a37c6b321e2fd374e6179b7))
- 已初始化過的 DB 不再顯示 init UI (V2-207) ([465ddc0](https://github.com/tianwen7252/tianwen-v2/commit/465ddc0ae45a208b575a802508ecc03d8e7480ee))
- 攤位餐點加上 imageKey 對應現有圖片 (V2-207) ([247a5dc](https://github.com/tianwen7252/tianwen-v2/commit/247a5dc285bbb688e4736902982c8283fb7a29c3))
- 自動備份預設關閉 + DEV 模式提示 (V2-171) ([79a6ccd](https://github.com/tianwen7252/tianwen-v2/commit/79a6ccd6b44aabbae4a5f83be4dd710329bfb291))
- 裝置代號含 DEVICE_ID + 白飯圖片 + UI 顯示 ID (V2-206) ([a8acb10](https://github.com/tianwen7252/tianwen-v2/commit/a8acb1027f38b2d9ec2bb10b38f83ff8907c8fc2))
- 裝置代號換行顯示、最後備份時間從雲端取、圖片修正 (V2-206) ([469b28b](https://github.com/tianwen7252/tianwen-v2/commit/469b28bf0ec3b238af8320b1f33f298a134fdd13))
- 近期訂單空狀態改為「本日無訂單」 ([785bf4d](https://github.com/tianwen7252/tianwen-v2/commit/785bf4df10b2c9216b16011c699e203c468a1bd8))

## [2.6.0](https://github.com/tianwen7252/tianwen-v2/compare/v2.5.0...v2.6.0) (2026-04-07)

### Features

- 點餐頁面近期訂單 Tab — 已送餐切換 + 編輯訂單 (V2-198) ([716db5d](https://github.com/tianwen7252/tianwen-v2/commit/716db5d745465a7fc361d1e6840cebc11927ccc9))

### Bug Fixes

- adjust icons ([1e26915](https://github.com/tianwen7252/tianwen-v2/commit/1e26915b5b20b78d349b764f794203b43327ffcf))
- bugs & enhancements 修正 (V2-171) ([222e1df](https://github.com/tianwen7252/tianwen-v2/commit/222e1dff2784373182f357429707cee433648cc0))
- notification 預設 top-center、toggleServed 不更新 updated_at (V2-198) ([102b5eb](https://github.com/tianwen7252/tianwen-v2/commit/102b5eb551bd3525a60036eec3b8e43a56e4bce1))
- OrderPanel 在 tab 內移除 px-4，modal 內保留 (V2-198) ([7a1643e](https://github.com/tianwen7252/tianwen-v2/commit/7a1643eca171d2df2a3a8cfcec050a0e5866b423))
- tab badge 和刪除按鈕即時更新 (V2-198) ([811a871](https://github.com/tianwen7252/tianwen-v2/commit/811a8719be2dafdcd5fefa130ed04a74e4de1b28))
- tab 改為下劃線風格、刪除按鈕調整、近期訂單恢復滑動刪除 (V2-198) ([9bdc087](https://github.com/tianwen7252/tianwen-v2/commit/9bdc0871c7ae8277e3a9f170334d42782d1b9fe7))
- 備份檔名改 tianwen- 開頭、表格欄寬、iPad header shadow (V2-171) ([6bd6b53](https://github.com/tianwen7252/tianwen-v2/commit/6bd6b53db9afad5e42d73ee1a0ff3bc8e5d3e441))
- 排程選擇器移到按鈕上方一起置底 (V2-171) ([9281919](https://github.com/tianwen7252/tianwen-v2/commit/9281919e8974060e5376321379109a1fb1b4b382))
- 移除 order_items 的 commodity_id FK 約束 (V2-198) ([def2a99](https://github.com/tianwen7252/tianwen-v2/commit/def2a99b68d7bb24e5ceadada1d9fe7110e9f270))
- 訂單送出/編輯失敗記錄到 error_logs (V2-198) ([c5252b9](https://github.com/tianwen7252/tianwen-v2/commit/c5252b9ef4745b7b8aebbf68f041f12cd41b5e20))
- 近期訂單一進頁面就載入、任何新增品項都自動切 tab (V2-198) ([aabd545](https://github.com/tianwen7252/tianwen-v2/commit/aabd545cf98255f7584175979a881ec537cc233e))
- 近期訂單持久顯示、新增餐點自動切 tab、改名餐點項目 (V2-198) ([8fb873c](https://github.com/tianwen7252/tianwen-v2/commit/8fb873c0cc2a049968492677eb2cc4ff45335f86))
- 近期訂單白畫面 — tab content 容器加 flex flex-col (V2-198) ([ab74c13](https://github.com/tianwen7252/tianwen-v2/commit/ab74c1337251443c462869d4ee09dce034ae5b8c))
- 雲端備份 UI 改善 + header shadow 修正 (V2-171) ([51696a2](https://github.com/tianwen7252/tianwen-v2/commit/51696a2ff0e7b653b3afc2886a5210bb74c572b0))

## [2.5.0](https://github.com/tianwen7252/tianwen-v2/compare/v2.4.2...v2.5.0) (2026-04-07)

### Features

- auto-refresh Google token on 401 (strategy A) ([122dabf](https://github.com/tianwen7252/tianwen-v2/commit/122dabf9154672b7ad1520d89595b7ed7ec8b692))
- persist backup schedule to SQLite DB via schema_meta (V2-196) ([7e70296](https://github.com/tianwen7252/tianwen-v2/commit/7e70296e3ab7107ed09772d6143a817992b4e73b))
- presigned URL direct R2 upload/download (V2-197) ([b864102](https://github.com/tianwen7252/tianwen-v2/commit/b864102da5e4590af6cd3a0e420e20d17b9543d2))
- simplify backup schedule + R2 retention limit (max 30) ([1a16a13](https://github.com/tianwen7252/tianwen-v2/commit/1a16a132e4d3f430a3855e8c8d710ec726923f2c))

### Bug Fixes

- add aws-sdk dynamic import comment + saveSettings disabled style ([5b69835](https://github.com/tianwen7252/tianwen-v2/commit/5b698354c7213249f92230ce9059620c5a7c6317))
- disable clear buttons when no records exist ([87fdf18](https://github.com/tianwen7252/tianwen-v2/commit/87fdf187367b61412c0d8a703a3d2a9cb371d227))
- move R2 backup cleanup from frontend to API server-side (V2-196) ([d4f8c79](https://github.com/tianwen7252/tianwen-v2/commit/d4f8c7943db8b524b243cf7485817428d31c7c03))
- remove \_lib/ shared module — inline all S3 logic in handlers ([939df49](https://github.com/tianwen7252/tianwen-v2/commit/939df4931fd5add2ec169538810b3b2c61ee5a02))
- remove localStorage fallback — backup schedule only in DB (V2-196) ([5269916](https://github.com/tianwen7252/tianwen-v2/commit/52699163da16aab601b02ba9ea7a7d34594f7896))
- resolve Vercel Function bundler crash with @aws-sdk/client-s3 ([a9491a7](https://github.com/tianwen7252/tianwen-v2/commit/a9491a72211c8e0181bb695f6faeac77c79fec36))
- show percent sign in circular progress bar (e.g. 0%) ([ef63b97](https://github.com/tianwen7252/tianwen-v2/commit/ef63b976cb88ae4a33bc3376db33998ddfb584bb))
- shrink storage progress bar, show usage/remaining below ([1f828fb](https://github.com/tianwen7252/tianwen-v2/commit/1f828fbddd0f7495f19e2e13ce8e8cdc1db73b08))
- storage usage/remaining labels on separate lines from values ([7e95da3](https://github.com/tianwen7252/tianwen-v2/commit/7e95da3bf00f401b133ec42927c705e22346385b))
- use dynamic import for @aws-sdk/client-s3 in Vercel Functions ([7268f82](https://github.com/tianwen7252/tianwen-v2/commit/7268f82d5aaa5fffa1a1c2ad6fbdec675ea8b082))
- use readable date format for backup/export filenames ([00c6f45](https://github.com/tianwen7252/tianwen-v2/commit/00c6f45e7316f0cc709ee830325aa12513f622ba))
- write backup errors to error_logs table ([877c8c5](https://github.com/tianwen7252/tianwen-v2/commit/877c8c5481377fa8575fe85e7c675e3483408202))

## [2.4.2](https://github.com/tianwen7252/tianwen-v2/compare/v2.4.1...v2.4.2) (2026-04-06)

### Bug Fixes

- provide iPad-specific apple-touch-icon sizes (152/167/180) ([3263b1c](https://github.com/tianwen7252/tianwen-v2/commit/3263b1c16817bab7980b2a010ef0413eef67ae0d))

## [2.4.1](https://github.com/tianwen7252/tianwen-v2/compare/v2.4.0...v2.4.1) (2026-04-06)

### Bug Fixes

- PWA app icons — square crop, remove alpha transparency ([80276be](https://github.com/tianwen7252/tianwen-v2/commit/80276befdeadab1cf200de7f3798bbed32c87973))

## [2.4.0](https://github.com/tianwen7252/tianwen-v2/compare/v2.3.0...v2.4.0) (2026-04-06)

### Features

- implement cloud backup functionality (V2-194) ([3987899](https://github.com/tianwen7252/tianwen-v2/commit/398789908471c9e990fd9cfde430127c07f30da8))
- V1 import, dark mode, UI redesign, iPad fixes (V2-195) ([#12](https://github.com/tianwen7252/tianwen-v2/issues/12)) ([e7554a2](https://github.com/tianwen7252/tianwen-v2/commit/e7554a23bd4ac324e32df19ce8dfed25bf0674f2))

## [2.3.0](https://github.com/tianwen7252/tianwen-v2/compare/v2.2.0-alpha...v2.3.0) (2026-04-06)

### Features

- architecture & DB improvements (V2-186) ([#9](https://github.com/tianwen7252/tianwen-v2/issues/9)) ([f59907e](https://github.com/tianwen7252/tianwen-v2/commit/f59907e26cb1e6823db6d8c7104873e9cf4b0b92))

### Bug Fixes

- iPad OPFS InvalidStateError race condition on page reload / PWA update — retry + pagehide worker terminate + lock screen fallback
- default employees no longer auto-seeded at DB init (only via dev test-data page)
- orders calendar popup centered below button instead of flush left
- apple-touch-icon uses 512px for crisp iPadOS 17+ large icon mode
- system info version card shows current site URL

## [2.2.0-alpha](https://github.com/tianwen7252/tianwen-v2/compare/v2.1.0-alpha...v2.2.0-alpha) (2026-04-02)

### Features

- /preview→/dev + Modal gold variant + admin notify.info (V2-165~V2-167) ([#3](https://github.com/tianwen7252/tianwen-v2/issues/3)) ([b02e3c8](https://github.com/tianwen7252/tianwen-v2/commit/b02e3c854827d88eeb36296bd2742445e0f90e16))
- add API and adjust some styles ([dd6c0fd](https://github.com/tianwen7252/tianwen-v2/commit/dd6c0fd1022a58cd976614d5a1e68d183d3ac498))
- add category tabs for order page ([7b830f3](https://github.com/tianwen7252/tianwen-v2/commit/7b830f3637ec3dfbc0c5e1296bdb591da27c148f))
- add chart type options ([e1e78bf](https://github.com/tianwen7252/tianwen-v2/commit/e1e78bf17e998dbee63e5a757ebef5da7b1fd7e5))
- add database ([08cad88](https://github.com/tianwen7252/tianwen-v2/commit/08cad8842113d4821d78b8bf3d03d9015240c6bb))
- add ipad 10 and ipad air 2024 support ([0c223ba](https://github.com/tianwen7252/tianwen-v2/commit/0c223baa70a4f3b9d463eac57cd68dd810bac271))
- add more charts ([cfc8624](https://github.com/tianwen7252/tianwen-v2/commit/cfc862466a83e07cebd51f1ecb804e646c70aa85))
- add more system info and keep going on product page ([0a3a076](https://github.com/tianwen7252/tianwen-v2/commit/0a3a076ed045412339bfae31f6b414bba7af54af))
- add new charts and improve performance ([6634ef1](https://github.com/tianwen7252/tianwen-v2/commit/6634ef1104f80fa1708a5c3d74647ec29012680e))
- add new system info and keep fixing product page ([d975cdb](https://github.com/tianwen7252/tianwen-v2/commit/d975cdbb11d2cdfbfbfd1d7565f53a26dda40f10))
- add new table dailyData to modify day's total ([dcdd42a](https://github.com/tianwen7252/tianwen-v2/commit/dcdd42afa67eeef96ae160d883b1df4c856ef322))
- add order action in order list ([820c2a2](https://github.com/tianwen7252/tianwen-v2/commit/820c2a28bee1130d6444ae128852c5a4d7b32431))
- add order API and action UIs ([c7651b5](https://github.com/tianwen7252/tianwen-v2/commit/c7651b56120f9c08f857b28039d21ad92769c771))
- add order tags and improve order drawer ([2a206bb](https://github.com/tianwen7252/tianwen-v2/commit/2a206bb6eb148c518f423baa23271840ae67b242))
- add Playwright E2E testing framework with full Jira status integration ([280ab61](https://github.com/tianwen7252/tianwen-v2/commit/280ab61155aadb362fb5439ba6d3f4a6a4897daf))
- add profits demo chart and keyboard bug fixes ([bb01c3e](https://github.com/tianwen7252/tianwen-v2/commit/bb01c3e883d4fcb20ec84fc3905bbb0db3262566))
- add routing and update db scheme ([704db43](https://github.com/tianwen7252/tianwen-v2/commit/704db430a2ab2556601ee3178823f775d8160d21))
- add StaffAdmin UI, AuthGuard sub variant, ClockIn improvements & GitHub CI/CD ([60cca3e](https://github.com/tianwen7252/tianwen-v2/commit/60cca3e3b8917937a70cc6a0eee2c709b96ba492))
- add statistics page and charts ([4925afd](https://github.com/tianwen7252/tianwen-v2/commit/4925afda962d79b8a25b353a0cdb5999a716b713))
- add year group for anchor ([6113d09](https://github.com/tianwen7252/tianwen-v2/commit/6113d09fa497409b72845dcc18fa1e2458585896))
- **backup:** complete backup page ([2365e49](https://github.com/tianwen7252/tianwen-v2/commit/2365e49ed85be31cfa055b8cfdbee5d32713c2a4))
- **backup:** init backup page ([54461c1](https://github.com/tianwen7252/tianwen-v2/commit/54461c19c0a0d7d703222407e3a97c9c69372ec5))
- complete order list without action items ([379ffbe](https://github.com/tianwen7252/tianwen-v2/commit/379ffbef7ba564b94205724fe7aad9419fe7e394))
- develop → master 員工管理與考勤系統重新設計 ([#11](https://github.com/tianwen7252/tianwen-v2/issues/11)) ([1e48def](https://github.com/tianwen7252/tianwen-v2/commit/1e48defe98ab349e337ef5c95cfe35f6957aecc8))
- ESLint + Prettier + Husky 開發工具設定 (V2-14) ([6554424](https://github.com/tianwen7252/tianwen-v2/commit/6554424a97c05bf1ea082e795ad7a26bd3a21e4d))
- Framer Motion 動畫框架整合 (V2-19) ([#19](https://github.com/tianwen7252/tianwen-v2/issues/19)) ([1414bd2](https://github.com/tianwen7252/tianwen-v2/commit/1414bd2b2430dd82b9e7c04df516cc2743654467))
- GlassModal 加入 ShineBorder 動畫邊框 ([b87b918](https://github.com/tianwen7252/tianwen-v2/commit/b87b9186431eb19ae46aee43bf285528f7248761))
- implement staff clock-in feature and upgrade dependencies ([598fe19](https://github.com/tianwen7252/tianwen-v2/commit/598fe19714f742ffc938b0e616cd66a13b510156))
- improve bundle size and tree-shacking for mathjs and lodash ([bc88345](https://github.com/tianwen7252/tianwen-v2/commit/bc88345c695fafa0ff0884b1dc3ad3cc6d742d5b))
- improve keyboard buttons size ([f6678e5](https://github.com/tianwen7252/tianwen-v2/commit/f6678e5dcd53612d2c7e112d74630f208413cf7d))
- improve keyboard UI ([9d94603](https://github.com/tianwen7252/tianwen-v2/commit/9d946036ca715ac992a67348dc6596080132acdd))
- improve order list ([380f6a7](https://github.com/tianwen7252/tianwen-v2/commit/380f6a73bb8110404e40b9692c60467851e0acb6))
- improve order list styles ([47523d3](https://github.com/tianwen7252/tianwen-v2/commit/47523d36106bc0e37bd0faea8df5c2999bd7a321))
- initialize home page ([eca4892](https://github.com/tianwen7252/tianwen-v2/commit/eca4892e13b66bed65e48cf5e244a264884969f5))
- integrate Release Please for automated versioning ([e5a529b](https://github.com/tianwen7252/tianwen-v2/commit/e5a529b19c1219a7bbf4048266badd6b687f958c))
- keyboard implementation ([149dff2](https://github.com/tianwen7252/tianwen-v2/commit/149dff2a6aca7cb36569304422ea467f6c8ddb2b))
- **keyboard:** connecting api data ([bd5808a](https://github.com/tianwen7252/tianwen-v2/commit/bd5808ac170b73e1398292eed33753b0dba98055))
- **keyboard:** UI adjustment from feedback and ipad app improvement ([4f458e4](https://github.com/tianwen7252/tianwen-v2/commit/4f458e486183577254d778724c4a35428b6eec0e))
- merged the same meals in order list ([275e140](https://github.com/tianwen7252/tianwen-v2/commit/275e1406a7dc93a7feec678430376f9f3cf046c3))
- migrate Jira integration from jira-utils.js hooks to Atlassian MCP ([b116228](https://github.com/tianwen7252/tianwen-v2/commit/b11622885537011bdf681d94090f12f570d3d595))
- migrate package manager from npm to pnpm ([30e5913](https://github.com/tianwen7252/tianwen-v2/commit/30e591395ef93f5fee2c9db3010e17b73c970a19))
- modal 開啟/關閉動畫（Ant Design 風格） ([b903418](https://github.com/tianwen7252/tianwen-v2/commit/b903418a16eb2f4cfb9ea0ce462a314609414ea1))
- new icon and new comm prices ([c4fa74d](https://github.com/tianwen7252/tianwen-v2/commit/c4fa74d0223d7b46dba4f1cda44a4c7853596548))
- new manifest script ([cec28cf](https://github.com/tianwen7252/tianwen-v2/commit/cec28cfde778d12f9194804779aaadc576932045))
- new stickyheader and bug fixes ([5a9966e](https://github.com/tianwen7252/tianwen-v2/commit/5a9966e7b6d9f623b8dc8ebafa9bc62c8fd8ba02))
- new UI adjustment ([292b869](https://github.com/tianwen7252/tianwen-v2/commit/292b86952e7f4a36d37c463afc3939ae702c6183))
- new version ([e867339](https://github.com/tianwen7252/tianwen-v2/commit/e86733955ec6c913b96d29279fb7452980b93f7f))
- now total is editable ([5be2a09](https://github.com/tianwen7252/tianwen-v2/commit/5be2a094e1f1efd9f390f6a9074075db2f82aa08))
- order drawer implementation ([c0a5e4a](https://github.com/tianwen7252/tianwen-v2/commit/c0a5e4af4f839d339c7bd0410e7a1c3d48d5bc07))
- order list page initializaion ([180f0c3](https://github.com/tianwen7252/tianwen-v2/commit/180f0c30f7dbb728d617349624fb8237660aab2b))
- order list pagination ([7dca89f](https://github.com/tianwen7252/tianwen-v2/commit/7dca89fa101a302d00554e17b9d03a8b709f52b9))
- orders generator ([0534c3d](https://github.com/tianwen7252/tianwen-v2/commit/0534c3db43596a7c290e68c08f2197c2e67e1c62))
- prepare electron ([193657a](https://github.com/tianwen7252/tianwen-v2/commit/193657a03deafaf4dc7b8197619b6f125b674a8d))
- PWA support ([6947590](https://github.com/tianwen7252/tianwen-v2/commit/69475906ea0cff68465ef4b1ede3b737be5b295e))
- React Hook Form + Zod 表單基礎架構 (V2-18) ([#18](https://github.com/tianwen7252/tianwen-v2/issues/18)) ([f8a0e9f](https://github.com/tianwen7252/tianwen-v2/commit/f8a0e9f679a95081fb92d7f30f53bc82484ac425))
- react-error-boundary 錯誤邊界 (V2-21) ([#21](https://github.com/tianwen7252/tianwen-v2/issues/21)) ([98cbb23](https://github.com/tianwen7252/tianwen-v2/commit/98cbb23647159d464cf106de2a30d2f8b91a3a60))
- react-i18next 多語系基礎架構 (V2-22) ([#22](https://github.com/tianwen7252/tianwen-v2/issues/22)) ([9298cc2](https://github.com/tianwen7252/tianwen-v2/commit/9298cc23cb08912a230e4bc2ec1c2909582f318d))
- records calendar redesign + SW update modal + release config (V2-4, V2-182) ([eef2bdb](https://github.com/tianwen7252/tianwen-v2/commit/eef2bdb55800543f77083d504e6fa8222f6aae0a))
- release-please 版本發布自動化 (V2-24) ([#23](https://github.com/tianwen7252/tianwen-v2/issues/23)) ([61c8c48](https://github.com/tianwen7252/tianwen-v2/commit/61c8c4826f85100c2e9645cbeea1c72ec432d804))
- removing the meal name guess ([815705a](https://github.com/tianwen7252/tianwen-v2/commit/815705a58051be88b525371d596f75e47e71a6e1))
- Repository Pattern + Zod schemas 資料層 (V2-12) ([6043d20](https://github.com/tianwen7252/tianwen-v2/commit/6043d20afaa7ff439ad9a7d6b47798536181c6e9))
- restructure components and pages and initizlize setting pages ([bf3698d](https://github.com/tianwen7252/tianwen-v2/commit/bf3698d352bf6430fbb22146b4fe3fba928e3424))
- separated order page and keyboard ([3884396](https://github.com/tianwen7252/tianwen-v2/commit/3884396a0c31132dc8c7b03d7e882eea6538a184))
- **settings:** add order types and adjust some code ([69722cd](https://github.com/tianwen7252/tianwen-v2/commit/69722cd8b982ce6e8bee182bc4f49d12f5711b7a))
- shadcn/ui + Tailwind v4 整合驗證 (V2-7) ([06d08ae](https://github.com/tianwen7252/tianwen-v2/commit/06d08ae8a3db0af54f0ee4167411273d1e774702))
- SQLite WASM + OPFS POC 驗證 (V2-5) ([e2488f5](https://github.com/tianwen7252/tianwen-v2/commit/e2488f5068f04f718a2dabea3d8f3538b4a5c674))
- Supabase Storage 備份/還原服務 POC (V2-6) ([01db2da](https://github.com/tianwen7252/tianwen-v2/commit/01db2da18369079186d86ac20cf0dc3b57aaa5dd))
- TanStack Router 路由架構 (V2-10) ([b0074a1](https://github.com/tianwen7252/tianwen-v2/commit/b0074a1af3e471b416139110cba93ed01133ed28))
- the init version ([6f812bc](https://github.com/tianwen7252/tianwen-v2/commit/6f812bc4e8df1c98934d8b81c3788d08419fa395))
- Toast 通知系統 — sonner 整合 (V2-20) ([#20](https://github.com/tianwen7252/tianwen-v2/issues/20)) ([c9c974e](https://github.com/tianwen7252/tianwen-v2/commit/c9c974ef4fcd3c0a7440a4a762ec1e954611ddd8))
- try to update ios icon ([ddc5851](https://github.com/tianwen7252/tianwen-v2/commit/ddc585114a5c40a9c1b9fb7772815c8a7276a803))
- update order scheme and API ([614fe81](https://github.com/tianwen7252/tianwen-v2/commit/614fe816f85056dce13eecec5832bdf117b06815))
- Vercel deployment + OPFS lock screen (V2-182, V2-183, V2-185) ([#4](https://github.com/tianwen7252/tianwen-v2/issues/4)) ([e9e6913](https://github.com/tianwen7252/tianwen-v2/commit/e9e691366cb56bcf983907ec959c07748d0132dc))
- Zustand + TanStack Query 狀態管理基礎 (V2-11) ([0cb3066](https://github.com/tianwen7252/tianwen-v2/commit/0cb30667c74c5b0ea237a43445abfc216788c279))
- 共用 GlassModal / ConfirmModal 元件 (V2-16) ([b769ecd](https://github.com/tianwen7252/tianwen-v2/commit/b769ecd1ff15f5a5a6b259fe63dde12497dea54d))
- 移除 mock data 冗餘層，整合 SQLite Repository (V2-28) ([#25](https://github.com/tianwen7252/tianwen-v2/issues/25)) ([4f7aa75](https://github.com/tianwen7252/tianwen-v2/commit/4f7aa75448861741c1e0644721c449e2f8cce28f))
- 統一 API 資料存取層 (V2-26) ([#17](https://github.com/tianwen7252/tianwen-v2/issues/17)) ([4e65fcc](https://github.com/tianwen7252/tianwen-v2/commit/4e65fccf58c970ac8cfc300d97b686bd02b4fd6f))
- 設定 jf-openhuninn 為預設字體 ([f2a5db3](https://github.com/tianwen7252/tianwen-v2/commit/f2a5db3804dd62183a622d8b7ab8faea6115fbff))
- 週末考勤顯示修正、打卡頁面標題更新、總工時分鐘顯示 ([#15](https://github.com/tianwen7252/tianwen-v2/issues/15)) ([1223fb5](https://github.com/tianwen7252/tianwen-v2/commit/1223fb5ceecaa8ab56f84a959bd9db23adfd4669))

### Bug Fixes

- add node type reference to manifest.ts for TypeScript build ([725afc9](https://github.com/tianwen7252/tianwen-v2/commit/725afc92e49c0390558d01c92f04b0cbabb31819))
- add safeTransition for Jira status resilience and document full status flow ([37ee6b5](https://github.com/tianwen7252/tianwen-v2/commit/37ee6b507a76fce0fda88745be4231f2a0307ea9))
- adding mathjs dependencies to avoid source code missing ([d521031](https://github.com/tianwen7252/tianwen-v2/commit/d521031a599c77a25dd8b456bc79734a76243c07))
- address code review findings for Phase 0 POC ([365aac7](https://github.com/tianwen7252/tianwen-v2/commit/365aac7f5e9dddbd5a75087e7a37e2bdb5316084))
- adjust 404.html ([4a72c7e](https://github.com/tianwen7252/tianwen-v2/commit/4a72c7e3f8913f51d12ad6e6ec696287c3ffb0ed))
- adjust button font size ([b7b0027](https://github.com/tianwen7252/tianwen-v2/commit/b7b00272b8851612056025d4c935674981bbedd8))
- adjust more ipad css ([b3142cf](https://github.com/tianwen7252/tianwen-v2/commit/b3142cff041a6ab01abc6208e23db56dad596ff5))
- adjust UI for ipad 10 ([4ff48fe](https://github.com/tianwen7252/tianwen-v2/commit/4ff48fe1eb99526285981f9c2221e5b1593d83ee))
- adjust UI for ipad 10 ([93057d4](https://github.com/tianwen7252/tianwen-v2/commit/93057d4a8e72c06ffd3e7aaf74810e7f25d0b9d6))
- amend npm scripts ([9f9eb96](https://github.com/tianwen7252/tianwen-v2/commit/9f9eb96e3ed0a0fb0056745b681054e75cf4f8ab))
- bug fix and add new commondities ([e2995a5](https://github.com/tianwen7252/tianwen-v2/commit/e2995a503155fcdc7ee3d9070e54d70fa7c04bec))
- bug fix of total edition ([164d806](https://github.com/tianwen7252/tianwen-v2/commit/164d8064fd38390b690f4c029705026fb3bb5b40))
- bug fix where the edited total should work with same price ([cc7516e](https://github.com/tianwen7252/tianwen-v2/commit/cc7516e139055ed3574fae78b2be7ad6350a63f2))
- bug fixes ([9aac550](https://github.com/tianwen7252/tianwen-v2/commit/9aac550f5b586d1c199f64206cdbf7cede56cc67))
- Bug 修正集合 (V2-95) ([#2](https://github.com/tianwen7252/tianwen-v2/issues/2)) ([0997835](https://github.com/tianwen7252/tianwen-v2/commit/09978356eee6e1c2f738e6e4185d7c8da07b4f2e))
- correct last record number and the order list sort ([1c3386a](https://github.com/tianwen7252/tianwen-v2/commit/1c3386a90d3ab13967fb2c6aae7de63ba42d4e9d))
- correct the dates on title on order list page ([888e0a9](https://github.com/tianwen7252/tianwen-v2/commit/888e0a942efd95f22ec548f1bc0be4093f8f2360))
- demo modal 顯示 avatar 圖片 ([f962bcd](https://github.com/tianwen7252/tianwen-v2/commit/f962bcd3892568918e2299a8cbd40bfb311f593b))
- gradient class name mismatch (modal vs model) ([cdea3e3](https://github.com/tianwen7252/tianwen-v2/commit/cdea3e3d8bac4a457e9618acb22b9600cb8a21f3))
- import Interpolation from @emotion/react instead of @emotion/serialize ([f16b1b9](https://github.com/tianwen7252/tianwen-v2/commit/f16b1b9ed0ee8394ea81f7422efcfb35ec619b8c))
- improve build settings ([e41ff4b](https://github.com/tianwen7252/tianwen-v2/commit/e41ff4b279e4909657bab3b6a270ffb01082b2ce))
- **keyboard, order, stats:** connect APIs and fix bugs ([759216a](https://github.com/tianwen7252/tianwen-v2/commit/759216a0d2323312bd4ea37240a8f97251b7303d))
- modal 使用 Radix primitives 精確還原 V1 樣式 ([dfe20c7](https://github.com/tianwen7252/tianwen-v2/commit/dfe20c7ef70a08186c1468b85d50fc1ee239f4f4))
- move deploy job into release-please workflow ([b330051](https://github.com/tianwen7252/tianwen-v2/commit/b3300515e7b0e92cd4540122bd4b48e3037682c7))
- PM time correction ([54524d3](https://github.com/tianwen7252/tianwen-v2/commit/54524d3196c84b3b6750b086f1997b1ceb3bdf37))
- reduce keyboard mode ([332b91b](https://github.com/tianwen7252/tianwen-v2/commit/332b91bf25da6c5d18cc7c0a6489653838e94008))
- release a test version 0.0.1 ([042d71b](https://github.com/tianwen7252/tianwen-v2/commit/042d71b1e6251b19e6a311a84a8ff5ec6ae33557))
- remove settings.local.json ([7cdd77d](https://github.com/tianwen7252/tianwen-v2/commit/7cdd77df596f411af239b7c85b97de5b553498f4))
- resolve CI lint errors and allow warnings in lint config ([835c820](https://github.com/tianwen7252/tianwen-v2/commit/835c82024532f4c047c248af042db647851f7adf))
- resolve ESLint arrow-parens errors in E2E test files ([496a9d5](https://github.com/tianwen7252/tianwen-v2/commit/496a9d512fc2d02dc7e68d5a5062b70a515807e3))
- resolve flaky E2E tests and CI report artifact ([d27c6ba](https://github.com/tianwen7252/tianwen-v2/commit/d27c6ba73386e805de55dfb0b8f31c7bbb20bb22))
- resolved bundle issue ([2c8aff2](https://github.com/tianwen7252/tianwen-v2/commit/2c8aff272677ede92d37139ec41610919e2aa265))
- shine color presets 調淡色調 ([f5d9d55](https://github.com/tianwen7252/tianwen-v2/commit/f5d9d55fdb9d1702aa948758c407d3a732673bfd))
- show edit mode correctly after scrolling on order list page ([11efcd9](https://github.com/tianwen7252/tianwen-v2/commit/11efcd9576b93982139552b3ede53c3e2f18b547))
- soups were not correct ([60183e9](https://github.com/tianwen7252/tianwen-v2/commit/60183e923bc31338a11bd5a6cd3aa8a3907e4608))
- submit a new version ([2c99125](https://github.com/tianwen7252/tianwen-v2/commit/2c99125f28113044d7b1cdee3d686de7ee0f02c5))
- sync manifest.json with Release Please version bump ([5798c18](https://github.com/tianwen7252/tianwen-v2/commit/5798c18c71c0fef24d644701542af4bcbd534725))
- try to fix bundle issue ([49159e0](https://github.com/tianwen7252/tianwen-v2/commit/49159e0e23bf1b993fa5c13f84563d8179f89cb1))
- unify AuthGuard login flow so StaffAdmin and Backup share auth state ([44793ca](https://github.com/tianwen7252/tianwen-v2/commit/44793ca2892b92e899f991e9ee417aa933242784))
- update commondities ([af81918](https://github.com/tianwen7252/tianwen-v2/commit/af81918e3621cb08c1ca6bf0351196a903256fbf))
- update index and 404 html ([e9df688](https://github.com/tianwen7252/tianwen-v2/commit/e9df6885c27ce9bd605c65797699f5c46a370d46))
- update manifest ([d600997](https://github.com/tianwen7252/tianwen-v2/commit/d6009979c8d5e3cfbe40d94811b611e939510eed))
- update repo name ([97a12ca](https://github.com/tianwen7252/tianwen-v2/commit/97a12cabf2c3b9f8b2c767f170bec3ad66304973))
- update start_url ([9f06847](https://github.com/tianwen7252/tianwen-v2/commit/9f06847c6ed54ba097ba8ca52e3eb0a944b84552))
- update tests to fix CI failures and remove stale snapshots ([4e1d60c](https://github.com/tianwen7252/tianwen-v2/commit/4e1d60c9f1ae0e12624da6c5dc4dc0bed8ae4753))
- upgrade @types/node to ^24 and add .npmrc legacy-peer-deps for CI compatibility ([5cafd2c](https://github.com/tianwen7252/tianwen-v2/commit/5cafd2c7ec9ca1b70dd339b4d08e274e53b1ded5))
- use --max-warnings 9999 instead of -1 for ESLint compatibility ([349ccfd](https://github.com/tianwen7252/tianwen-v2/commit/349ccfd952c56df3cc6544d31b57981535a618c9))
- use pnpm instead of npm in playwright webServer command ([2605d03](https://github.com/tianwen7252/tianwen-v2/commit/2605d0338de034ee891e12827b5d8732029b2b02))
- v0.0.18 ([97540ee](https://github.com/tianwen7252/tianwen-v2/commit/97540ee09e787221d1421ecea8aaace9f11fbd16))
- 改用 Google Fonts Huninn 字體 ([8d8dd6b](https://github.com/tianwen7252/tianwen-v2/commit/8d8dd6b7340d474b49cd7f2c16e295d3af0f469e))

## [2.1.0-alpha](https://github.com/tianwen7252/tianwen-v2/compare/tianwen-pos-v2.0.0-alpha...tianwen-pos-v2.1.0-alpha) (2026-04-02)

### Features

- /preview→/dev + Modal gold variant + admin notify.info (V2-165~V2-167) ([#3](https://github.com/tianwen7252/tianwen-v2/issues/3)) ([b02e3c8](https://github.com/tianwen7252/tianwen-v2/commit/b02e3c854827d88eeb36296bd2742445e0f90e16))
- add API and adjust some styles ([dd6c0fd](https://github.com/tianwen7252/tianwen-v2/commit/dd6c0fd1022a58cd976614d5a1e68d183d3ac498))
- add category tabs for order page ([7b830f3](https://github.com/tianwen7252/tianwen-v2/commit/7b830f3637ec3dfbc0c5e1296bdb591da27c148f))
- add chart type options ([e1e78bf](https://github.com/tianwen7252/tianwen-v2/commit/e1e78bf17e998dbee63e5a757ebef5da7b1fd7e5))
- add database ([08cad88](https://github.com/tianwen7252/tianwen-v2/commit/08cad8842113d4821d78b8bf3d03d9015240c6bb))
- add ipad 10 and ipad air 2024 support ([0c223ba](https://github.com/tianwen7252/tianwen-v2/commit/0c223baa70a4f3b9d463eac57cd68dd810bac271))
- add more charts ([cfc8624](https://github.com/tianwen7252/tianwen-v2/commit/cfc862466a83e07cebd51f1ecb804e646c70aa85))
- add more system info and keep going on product page ([0a3a076](https://github.com/tianwen7252/tianwen-v2/commit/0a3a076ed045412339bfae31f6b414bba7af54af))
- add new charts and improve performance ([6634ef1](https://github.com/tianwen7252/tianwen-v2/commit/6634ef1104f80fa1708a5c3d74647ec29012680e))
- add new system info and keep fixing product page ([d975cdb](https://github.com/tianwen7252/tianwen-v2/commit/d975cdbb11d2cdfbfbfd1d7565f53a26dda40f10))
- add new table dailyData to modify day's total ([dcdd42a](https://github.com/tianwen7252/tianwen-v2/commit/dcdd42afa67eeef96ae160d883b1df4c856ef322))
- add order action in order list ([820c2a2](https://github.com/tianwen7252/tianwen-v2/commit/820c2a28bee1130d6444ae128852c5a4d7b32431))
- add order API and action UIs ([c7651b5](https://github.com/tianwen7252/tianwen-v2/commit/c7651b56120f9c08f857b28039d21ad92769c771))
- add order tags and improve order drawer ([2a206bb](https://github.com/tianwen7252/tianwen-v2/commit/2a206bb6eb148c518f423baa23271840ae67b242))
- add Playwright E2E testing framework with full Jira status integration ([280ab61](https://github.com/tianwen7252/tianwen-v2/commit/280ab61155aadb362fb5439ba6d3f4a6a4897daf))
- add profits demo chart and keyboard bug fixes ([bb01c3e](https://github.com/tianwen7252/tianwen-v2/commit/bb01c3e883d4fcb20ec84fc3905bbb0db3262566))
- add routing and update db scheme ([704db43](https://github.com/tianwen7252/tianwen-v2/commit/704db430a2ab2556601ee3178823f775d8160d21))
- add StaffAdmin UI, AuthGuard sub variant, ClockIn improvements & GitHub CI/CD ([60cca3e](https://github.com/tianwen7252/tianwen-v2/commit/60cca3e3b8917937a70cc6a0eee2c709b96ba492))
- add statistics page and charts ([4925afd](https://github.com/tianwen7252/tianwen-v2/commit/4925afda962d79b8a25b353a0cdb5999a716b713))
- add year group for anchor ([6113d09](https://github.com/tianwen7252/tianwen-v2/commit/6113d09fa497409b72845dcc18fa1e2458585896))
- **backup:** complete backup page ([2365e49](https://github.com/tianwen7252/tianwen-v2/commit/2365e49ed85be31cfa055b8cfdbee5d32713c2a4))
- **backup:** init backup page ([54461c1](https://github.com/tianwen7252/tianwen-v2/commit/54461c19c0a0d7d703222407e3a97c9c69372ec5))
- complete order list without action items ([379ffbe](https://github.com/tianwen7252/tianwen-v2/commit/379ffbef7ba564b94205724fe7aad9419fe7e394))
- develop → master 員工管理與考勤系統重新設計 ([#11](https://github.com/tianwen7252/tianwen-v2/issues/11)) ([1e48def](https://github.com/tianwen7252/tianwen-v2/commit/1e48defe98ab349e337ef5c95cfe35f6957aecc8))
- ESLint + Prettier + Husky 開發工具設定 (V2-14) ([6554424](https://github.com/tianwen7252/tianwen-v2/commit/6554424a97c05bf1ea082e795ad7a26bd3a21e4d))
- Framer Motion 動畫框架整合 (V2-19) ([#19](https://github.com/tianwen7252/tianwen-v2/issues/19)) ([1414bd2](https://github.com/tianwen7252/tianwen-v2/commit/1414bd2b2430dd82b9e7c04df516cc2743654467))
- GlassModal 加入 ShineBorder 動畫邊框 ([b87b918](https://github.com/tianwen7252/tianwen-v2/commit/b87b9186431eb19ae46aee43bf285528f7248761))
- implement staff clock-in feature and upgrade dependencies ([598fe19](https://github.com/tianwen7252/tianwen-v2/commit/598fe19714f742ffc938b0e616cd66a13b510156))
- improve bundle size and tree-shacking for mathjs and lodash ([bc88345](https://github.com/tianwen7252/tianwen-v2/commit/bc88345c695fafa0ff0884b1dc3ad3cc6d742d5b))
- improve keyboard buttons size ([f6678e5](https://github.com/tianwen7252/tianwen-v2/commit/f6678e5dcd53612d2c7e112d74630f208413cf7d))
- improve keyboard UI ([9d94603](https://github.com/tianwen7252/tianwen-v2/commit/9d946036ca715ac992a67348dc6596080132acdd))
- improve order list ([380f6a7](https://github.com/tianwen7252/tianwen-v2/commit/380f6a73bb8110404e40b9692c60467851e0acb6))
- improve order list styles ([47523d3](https://github.com/tianwen7252/tianwen-v2/commit/47523d36106bc0e37bd0faea8df5c2999bd7a321))
- initialize home page ([eca4892](https://github.com/tianwen7252/tianwen-v2/commit/eca4892e13b66bed65e48cf5e244a264884969f5))
- integrate Release Please for automated versioning ([e5a529b](https://github.com/tianwen7252/tianwen-v2/commit/e5a529b19c1219a7bbf4048266badd6b687f958c))
- keyboard implementation ([149dff2](https://github.com/tianwen7252/tianwen-v2/commit/149dff2a6aca7cb36569304422ea467f6c8ddb2b))
- **keyboard:** connecting api data ([bd5808a](https://github.com/tianwen7252/tianwen-v2/commit/bd5808ac170b73e1398292eed33753b0dba98055))
- **keyboard:** UI adjustment from feedback and ipad app improvement ([4f458e4](https://github.com/tianwen7252/tianwen-v2/commit/4f458e486183577254d778724c4a35428b6eec0e))
- merged the same meals in order list ([275e140](https://github.com/tianwen7252/tianwen-v2/commit/275e1406a7dc93a7feec678430376f9f3cf046c3))
- migrate Jira integration from jira-utils.js hooks to Atlassian MCP ([b116228](https://github.com/tianwen7252/tianwen-v2/commit/b11622885537011bdf681d94090f12f570d3d595))
- migrate package manager from npm to pnpm ([30e5913](https://github.com/tianwen7252/tianwen-v2/commit/30e591395ef93f5fee2c9db3010e17b73c970a19))
- modal 開啟/關閉動畫（Ant Design 風格） ([b903418](https://github.com/tianwen7252/tianwen-v2/commit/b903418a16eb2f4cfb9ea0ce462a314609414ea1))
- new icon and new comm prices ([c4fa74d](https://github.com/tianwen7252/tianwen-v2/commit/c4fa74d0223d7b46dba4f1cda44a4c7853596548))
- new manifest script ([cec28cf](https://github.com/tianwen7252/tianwen-v2/commit/cec28cfde778d12f9194804779aaadc576932045))
- new stickyheader and bug fixes ([5a9966e](https://github.com/tianwen7252/tianwen-v2/commit/5a9966e7b6d9f623b8dc8ebafa9bc62c8fd8ba02))
- new UI adjustment ([292b869](https://github.com/tianwen7252/tianwen-v2/commit/292b86952e7f4a36d37c463afc3939ae702c6183))
- new version ([e867339](https://github.com/tianwen7252/tianwen-v2/commit/e86733955ec6c913b96d29279fb7452980b93f7f))
- now total is editable ([5be2a09](https://github.com/tianwen7252/tianwen-v2/commit/5be2a094e1f1efd9f390f6a9074075db2f82aa08))
- order drawer implementation ([c0a5e4a](https://github.com/tianwen7252/tianwen-v2/commit/c0a5e4af4f839d339c7bd0410e7a1c3d48d5bc07))
- order list page initializaion ([180f0c3](https://github.com/tianwen7252/tianwen-v2/commit/180f0c30f7dbb728d617349624fb8237660aab2b))
- order list pagination ([7dca89f](https://github.com/tianwen7252/tianwen-v2/commit/7dca89fa101a302d00554e17b9d03a8b709f52b9))
- orders generator ([0534c3d](https://github.com/tianwen7252/tianwen-v2/commit/0534c3db43596a7c290e68c08f2197c2e67e1c62))
- prepare electron ([193657a](https://github.com/tianwen7252/tianwen-v2/commit/193657a03deafaf4dc7b8197619b6f125b674a8d))
- PWA support ([6947590](https://github.com/tianwen7252/tianwen-v2/commit/69475906ea0cff68465ef4b1ede3b737be5b295e))
- React Hook Form + Zod 表單基礎架構 (V2-18) ([#18](https://github.com/tianwen7252/tianwen-v2/issues/18)) ([f8a0e9f](https://github.com/tianwen7252/tianwen-v2/commit/f8a0e9f679a95081fb92d7f30f53bc82484ac425))
- react-error-boundary 錯誤邊界 (V2-21) ([#21](https://github.com/tianwen7252/tianwen-v2/issues/21)) ([98cbb23](https://github.com/tianwen7252/tianwen-v2/commit/98cbb23647159d464cf106de2a30d2f8b91a3a60))
- react-i18next 多語系基礎架構 (V2-22) ([#22](https://github.com/tianwen7252/tianwen-v2/issues/22)) ([9298cc2](https://github.com/tianwen7252/tianwen-v2/commit/9298cc23cb08912a230e4bc2ec1c2909582f318d))
- release-please 版本發布自動化 (V2-24) ([#23](https://github.com/tianwen7252/tianwen-v2/issues/23)) ([61c8c48](https://github.com/tianwen7252/tianwen-v2/commit/61c8c4826f85100c2e9645cbeea1c72ec432d804))
- removing the meal name guess ([815705a](https://github.com/tianwen7252/tianwen-v2/commit/815705a58051be88b525371d596f75e47e71a6e1))
- Repository Pattern + Zod schemas 資料層 (V2-12) ([6043d20](https://github.com/tianwen7252/tianwen-v2/commit/6043d20afaa7ff439ad9a7d6b47798536181c6e9))
- restructure components and pages and initizlize setting pages ([bf3698d](https://github.com/tianwen7252/tianwen-v2/commit/bf3698d352bf6430fbb22146b4fe3fba928e3424))
- separated order page and keyboard ([3884396](https://github.com/tianwen7252/tianwen-v2/commit/3884396a0c31132dc8c7b03d7e882eea6538a184))
- **settings:** add order types and adjust some code ([69722cd](https://github.com/tianwen7252/tianwen-v2/commit/69722cd8b982ce6e8bee182bc4f49d12f5711b7a))
- shadcn/ui + Tailwind v4 整合驗證 (V2-7) ([06d08ae](https://github.com/tianwen7252/tianwen-v2/commit/06d08ae8a3db0af54f0ee4167411273d1e774702))
- SQLite WASM + OPFS POC 驗證 (V2-5) ([e2488f5](https://github.com/tianwen7252/tianwen-v2/commit/e2488f5068f04f718a2dabea3d8f3538b4a5c674))
- Supabase Storage 備份/還原服務 POC (V2-6) ([01db2da](https://github.com/tianwen7252/tianwen-v2/commit/01db2da18369079186d86ac20cf0dc3b57aaa5dd))
- TanStack Router 路由架構 (V2-10) ([b0074a1](https://github.com/tianwen7252/tianwen-v2/commit/b0074a1af3e471b416139110cba93ed01133ed28))
- the init version ([6f812bc](https://github.com/tianwen7252/tianwen-v2/commit/6f812bc4e8df1c98934d8b81c3788d08419fa395))
- Toast 通知系統 — sonner 整合 (V2-20) ([#20](https://github.com/tianwen7252/tianwen-v2/issues/20)) ([c9c974e](https://github.com/tianwen7252/tianwen-v2/commit/c9c974ef4fcd3c0a7440a4a762ec1e954611ddd8))
- try to update ios icon ([ddc5851](https://github.com/tianwen7252/tianwen-v2/commit/ddc585114a5c40a9c1b9fb7772815c8a7276a803))
- update order scheme and API ([614fe81](https://github.com/tianwen7252/tianwen-v2/commit/614fe816f85056dce13eecec5832bdf117b06815))
- Vercel deployment + OPFS lock screen (V2-182, V2-183, V2-185) ([#4](https://github.com/tianwen7252/tianwen-v2/issues/4)) ([e9e6913](https://github.com/tianwen7252/tianwen-v2/commit/e9e691366cb56bcf983907ec959c07748d0132dc))
- Zustand + TanStack Query 狀態管理基礎 (V2-11) ([0cb3066](https://github.com/tianwen7252/tianwen-v2/commit/0cb30667c74c5b0ea237a43445abfc216788c279))
- 共用 GlassModal / ConfirmModal 元件 (V2-16) ([b769ecd](https://github.com/tianwen7252/tianwen-v2/commit/b769ecd1ff15f5a5a6b259fe63dde12497dea54d))
- 移除 mock data 冗餘層，整合 SQLite Repository (V2-28) ([#25](https://github.com/tianwen7252/tianwen-v2/issues/25)) ([4f7aa75](https://github.com/tianwen7252/tianwen-v2/commit/4f7aa75448861741c1e0644721c449e2f8cce28f))
- 統一 API 資料存取層 (V2-26) ([#17](https://github.com/tianwen7252/tianwen-v2/issues/17)) ([4e65fcc](https://github.com/tianwen7252/tianwen-v2/commit/4e65fccf58c970ac8cfc300d97b686bd02b4fd6f))
- 設定 jf-openhuninn 為預設字體 ([f2a5db3](https://github.com/tianwen7252/tianwen-v2/commit/f2a5db3804dd62183a622d8b7ab8faea6115fbff))
- 週末考勤顯示修正、打卡頁面標題更新、總工時分鐘顯示 ([#15](https://github.com/tianwen7252/tianwen-v2/issues/15)) ([1223fb5](https://github.com/tianwen7252/tianwen-v2/commit/1223fb5ceecaa8ab56f84a959bd9db23adfd4669))

### Bug Fixes

- add node type reference to manifest.ts for TypeScript build ([725afc9](https://github.com/tianwen7252/tianwen-v2/commit/725afc92e49c0390558d01c92f04b0cbabb31819))
- add safeTransition for Jira status resilience and document full status flow ([37ee6b5](https://github.com/tianwen7252/tianwen-v2/commit/37ee6b507a76fce0fda88745be4231f2a0307ea9))
- adding mathjs dependencies to avoid source code missing ([d521031](https://github.com/tianwen7252/tianwen-v2/commit/d521031a599c77a25dd8b456bc79734a76243c07))
- address code review findings for Phase 0 POC ([365aac7](https://github.com/tianwen7252/tianwen-v2/commit/365aac7f5e9dddbd5a75087e7a37e2bdb5316084))
- adjust 404.html ([4a72c7e](https://github.com/tianwen7252/tianwen-v2/commit/4a72c7e3f8913f51d12ad6e6ec696287c3ffb0ed))
- adjust button font size ([b7b0027](https://github.com/tianwen7252/tianwen-v2/commit/b7b00272b8851612056025d4c935674981bbedd8))
- adjust more ipad css ([b3142cf](https://github.com/tianwen7252/tianwen-v2/commit/b3142cff041a6ab01abc6208e23db56dad596ff5))
- adjust UI for ipad 10 ([4ff48fe](https://github.com/tianwen7252/tianwen-v2/commit/4ff48fe1eb99526285981f9c2221e5b1593d83ee))
- adjust UI for ipad 10 ([93057d4](https://github.com/tianwen7252/tianwen-v2/commit/93057d4a8e72c06ffd3e7aaf74810e7f25d0b9d6))
- amend npm scripts ([9f9eb96](https://github.com/tianwen7252/tianwen-v2/commit/9f9eb96e3ed0a0fb0056745b681054e75cf4f8ab))
- bug fix and add new commondities ([e2995a5](https://github.com/tianwen7252/tianwen-v2/commit/e2995a503155fcdc7ee3d9070e54d70fa7c04bec))
- bug fix of total edition ([164d806](https://github.com/tianwen7252/tianwen-v2/commit/164d8064fd38390b690f4c029705026fb3bb5b40))
- bug fix where the edited total should work with same price ([cc7516e](https://github.com/tianwen7252/tianwen-v2/commit/cc7516e139055ed3574fae78b2be7ad6350a63f2))
- bug fixes ([9aac550](https://github.com/tianwen7252/tianwen-v2/commit/9aac550f5b586d1c199f64206cdbf7cede56cc67))
- Bug 修正集合 (V2-95) ([#2](https://github.com/tianwen7252/tianwen-v2/issues/2)) ([0997835](https://github.com/tianwen7252/tianwen-v2/commit/09978356eee6e1c2f738e6e4185d7c8da07b4f2e))
- correct last record number and the order list sort ([1c3386a](https://github.com/tianwen7252/tianwen-v2/commit/1c3386a90d3ab13967fb2c6aae7de63ba42d4e9d))
- correct the dates on title on order list page ([888e0a9](https://github.com/tianwen7252/tianwen-v2/commit/888e0a942efd95f22ec548f1bc0be4093f8f2360))
- demo modal 顯示 avatar 圖片 ([f962bcd](https://github.com/tianwen7252/tianwen-v2/commit/f962bcd3892568918e2299a8cbd40bfb311f593b))
- gradient class name mismatch (modal vs model) ([cdea3e3](https://github.com/tianwen7252/tianwen-v2/commit/cdea3e3d8bac4a457e9618acb22b9600cb8a21f3))
- import Interpolation from @emotion/react instead of @emotion/serialize ([f16b1b9](https://github.com/tianwen7252/tianwen-v2/commit/f16b1b9ed0ee8394ea81f7422efcfb35ec619b8c))
- improve build settings ([e41ff4b](https://github.com/tianwen7252/tianwen-v2/commit/e41ff4b279e4909657bab3b6a270ffb01082b2ce))
- **keyboard, order, stats:** connect APIs and fix bugs ([759216a](https://github.com/tianwen7252/tianwen-v2/commit/759216a0d2323312bd4ea37240a8f97251b7303d))
- modal 使用 Radix primitives 精確還原 V1 樣式 ([dfe20c7](https://github.com/tianwen7252/tianwen-v2/commit/dfe20c7ef70a08186c1468b85d50fc1ee239f4f4))
- move deploy job into release-please workflow ([b330051](https://github.com/tianwen7252/tianwen-v2/commit/b3300515e7b0e92cd4540122bd4b48e3037682c7))
- PM time correction ([54524d3](https://github.com/tianwen7252/tianwen-v2/commit/54524d3196c84b3b6750b086f1997b1ceb3bdf37))
- reduce keyboard mode ([332b91b](https://github.com/tianwen7252/tianwen-v2/commit/332b91bf25da6c5d18cc7c0a6489653838e94008))
- release a test version 0.0.1 ([042d71b](https://github.com/tianwen7252/tianwen-v2/commit/042d71b1e6251b19e6a311a84a8ff5ec6ae33557))
- remove settings.local.json ([7cdd77d](https://github.com/tianwen7252/tianwen-v2/commit/7cdd77df596f411af239b7c85b97de5b553498f4))
- resolve CI lint errors and allow warnings in lint config ([835c820](https://github.com/tianwen7252/tianwen-v2/commit/835c82024532f4c047c248af042db647851f7adf))
- resolve ESLint arrow-parens errors in E2E test files ([496a9d5](https://github.com/tianwen7252/tianwen-v2/commit/496a9d512fc2d02dc7e68d5a5062b70a515807e3))
- resolve flaky E2E tests and CI report artifact ([d27c6ba](https://github.com/tianwen7252/tianwen-v2/commit/d27c6ba73386e805de55dfb0b8f31c7bbb20bb22))
- resolved bundle issue ([2c8aff2](https://github.com/tianwen7252/tianwen-v2/commit/2c8aff272677ede92d37139ec41610919e2aa265))
- shine color presets 調淡色調 ([f5d9d55](https://github.com/tianwen7252/tianwen-v2/commit/f5d9d55fdb9d1702aa948758c407d3a732673bfd))
- show edit mode correctly after scrolling on order list page ([11efcd9](https://github.com/tianwen7252/tianwen-v2/commit/11efcd9576b93982139552b3ede53c3e2f18b547))
- soups were not correct ([60183e9](https://github.com/tianwen7252/tianwen-v2/commit/60183e923bc31338a11bd5a6cd3aa8a3907e4608))
- submit a new version ([2c99125](https://github.com/tianwen7252/tianwen-v2/commit/2c99125f28113044d7b1cdee3d686de7ee0f02c5))
- sync manifest.json with Release Please version bump ([5798c18](https://github.com/tianwen7252/tianwen-v2/commit/5798c18c71c0fef24d644701542af4bcbd534725))
- try to fix bundle issue ([49159e0](https://github.com/tianwen7252/tianwen-v2/commit/49159e0e23bf1b993fa5c13f84563d8179f89cb1))
- unify AuthGuard login flow so StaffAdmin and Backup share auth state ([44793ca](https://github.com/tianwen7252/tianwen-v2/commit/44793ca2892b92e899f991e9ee417aa933242784))
- update commondities ([af81918](https://github.com/tianwen7252/tianwen-v2/commit/af81918e3621cb08c1ca6bf0351196a903256fbf))
- update index and 404 html ([e9df688](https://github.com/tianwen7252/tianwen-v2/commit/e9df6885c27ce9bd605c65797699f5c46a370d46))
- update manifest ([d600997](https://github.com/tianwen7252/tianwen-v2/commit/d6009979c8d5e3cfbe40d94811b611e939510eed))
- update repo name ([97a12ca](https://github.com/tianwen7252/tianwen-v2/commit/97a12cabf2c3b9f8b2c767f170bec3ad66304973))
- update start_url ([9f06847](https://github.com/tianwen7252/tianwen-v2/commit/9f06847c6ed54ba097ba8ca52e3eb0a944b84552))
- update tests to fix CI failures and remove stale snapshots ([4e1d60c](https://github.com/tianwen7252/tianwen-v2/commit/4e1d60c9f1ae0e12624da6c5dc4dc0bed8ae4753))
- upgrade @types/node to ^24 and add .npmrc legacy-peer-deps for CI compatibility ([5cafd2c](https://github.com/tianwen7252/tianwen-v2/commit/5cafd2c7ec9ca1b70dd339b4d08e274e53b1ded5))
- use --max-warnings 9999 instead of -1 for ESLint compatibility ([349ccfd](https://github.com/tianwen7252/tianwen-v2/commit/349ccfd952c56df3cc6544d31b57981535a618c9))
- use pnpm instead of npm in playwright webServer command ([2605d03](https://github.com/tianwen7252/tianwen-v2/commit/2605d0338de034ee891e12827b5d8732029b2b02))
- v0.0.18 ([97540ee](https://github.com/tianwen7252/tianwen-v2/commit/97540ee09e787221d1421ecea8aaace9f11fbd16))
- 改用 Google Fonts Huninn 字體 ([8d8dd6b](https://github.com/tianwen7252/tianwen-v2/commit/8d8dd6b7340d474b49cd7f2c16e295d3af0f469e))

## [0.0.31](https://github.com/tianwen7252/tianwen7252.github.io/compare/v0.0.30...v0.0.31) (2026-03-21)

### Features

- 週末考勤顯示修正、打卡頁面標題更新、總工時分鐘顯示 ([#15](https://github.com/tianwen7252/tianwen7252.github.io/issues/15)) ([1223fb5](https://github.com/tianwen7252/tianwen7252.github.io/commit/1223fb5ceecaa8ab56f84a959bd9db23adfd4669))

## [0.0.30](https://github.com/tianwen7252/tianwen7252.github.io/compare/v0.0.29...v0.0.30) (2026-03-21)

### Features

- develop → master 員工管理與考勤系統重新設計 ([#11](https://github.com/tianwen7252/tianwen7252.github.io/issues/11)) ([1e48def](https://github.com/tianwen7252/tianwen7252.github.io/commit/1e48defe98ab349e337ef5c95cfe35f6957aecc8))

## [0.0.29](https://github.com/tianwen7252/tianwen7252.github.io/compare/v0.0.28...v0.0.29) (2026-03-18)

### Bug Fixes

- use pnpm instead of npm in playwright webServer command ([2605d03](https://github.com/tianwen7252/tianwen7252.github.io/commit/2605d0338de034ee891e12827b5d8732029b2b02))

## [0.0.28](https://github.com/tianwen7252/tianwen7252.github.io/compare/v0.0.27...v0.0.28) (2026-03-18)

### Bug Fixes

- move deploy job into release-please workflow ([b330051](https://github.com/tianwen7252/tianwen7252.github.io/commit/b3300515e7b0e92cd4540122bd4b48e3037682c7))

## [0.0.27](https://github.com/tianwen7252/tianwen7252.github.io/compare/v0.0.26...v0.0.27) (2026-03-18)

### Bug Fixes

- sync manifest.json with Release Please version bump ([5798c18](https://github.com/tianwen7252/tianwen7252.github.io/commit/5798c18c71c0fef24d644701542af4bcbd534725))

### Refactoring

- remove prettier from manifest.ts and move to devDependencies ([84e2fc0](https://github.com/tianwen7252/tianwen7252.github.io/commit/84e2fc0c30225a490a75baa25eaee5db3709e444))

## [0.0.26](https://github.com/tianwen7252/tianwen7252.github.io/compare/v0.0.25...v0.0.26) (2026-03-18)

### Features

- add API and adjust some styles ([dd6c0fd](https://github.com/tianwen7252/tianwen7252.github.io/commit/dd6c0fd1022a58cd976614d5a1e68d183d3ac498))
- add category tabs for order page ([7b830f3](https://github.com/tianwen7252/tianwen7252.github.io/commit/7b830f3637ec3dfbc0c5e1296bdb591da27c148f))
- add chart type options ([e1e78bf](https://github.com/tianwen7252/tianwen7252.github.io/commit/e1e78bf17e998dbee63e5a757ebef5da7b1fd7e5))
- add database ([08cad88](https://github.com/tianwen7252/tianwen7252.github.io/commit/08cad8842113d4821d78b8bf3d03d9015240c6bb))
- add ipad 10 and ipad air 2024 support ([0c223ba](https://github.com/tianwen7252/tianwen7252.github.io/commit/0c223baa70a4f3b9d463eac57cd68dd810bac271))
- add more charts ([cfc8624](https://github.com/tianwen7252/tianwen7252.github.io/commit/cfc862466a83e07cebd51f1ecb804e646c70aa85))
- add more system info and keep going on product page ([0a3a076](https://github.com/tianwen7252/tianwen7252.github.io/commit/0a3a076ed045412339bfae31f6b414bba7af54af))
- add new charts and improve performance ([6634ef1](https://github.com/tianwen7252/tianwen7252.github.io/commit/6634ef1104f80fa1708a5c3d74647ec29012680e))
- add new system info and keep fixing product page ([d975cdb](https://github.com/tianwen7252/tianwen7252.github.io/commit/d975cdbb11d2cdfbfbfd1d7565f53a26dda40f10))
- add new table dailyData to modify day's total ([dcdd42a](https://github.com/tianwen7252/tianwen7252.github.io/commit/dcdd42afa67eeef96ae160d883b1df4c856ef322))
- add order action in order list ([820c2a2](https://github.com/tianwen7252/tianwen7252.github.io/commit/820c2a28bee1130d6444ae128852c5a4d7b32431))
- add order API and action UIs ([c7651b5](https://github.com/tianwen7252/tianwen7252.github.io/commit/c7651b56120f9c08f857b28039d21ad92769c771))
- add order tags and improve order drawer ([2a206bb](https://github.com/tianwen7252/tianwen7252.github.io/commit/2a206bb6eb148c518f423baa23271840ae67b242))
- add Playwright E2E testing framework with full Jira status integration ([280ab61](https://github.com/tianwen7252/tianwen7252.github.io/commit/280ab61155aadb362fb5439ba6d3f4a6a4897daf))
- add profits demo chart and keyboard bug fixes ([bb01c3e](https://github.com/tianwen7252/tianwen7252.github.io/commit/bb01c3e883d4fcb20ec84fc3905bbb0db3262566))
- add routing and update db scheme ([704db43](https://github.com/tianwen7252/tianwen7252.github.io/commit/704db430a2ab2556601ee3178823f775d8160d21))
- add StaffAdmin UI, AuthGuard sub variant, ClockIn improvements & GitHub CI/CD ([60cca3e](https://github.com/tianwen7252/tianwen7252.github.io/commit/60cca3e3b8917937a70cc6a0eee2c709b96ba492))
- add statistics page and charts ([4925afd](https://github.com/tianwen7252/tianwen7252.github.io/commit/4925afda962d79b8a25b353a0cdb5999a716b713))
- add year group for anchor ([6113d09](https://github.com/tianwen7252/tianwen7252.github.io/commit/6113d09fa497409b72845dcc18fa1e2458585896))
- **backup:** complete backup page ([2365e49](https://github.com/tianwen7252/tianwen7252.github.io/commit/2365e49ed85be31cfa055b8cfdbee5d32713c2a4))
- **backup:** init backup page ([54461c1](https://github.com/tianwen7252/tianwen7252.github.io/commit/54461c19c0a0d7d703222407e3a97c9c69372ec5))
- complete order list without action items ([379ffbe](https://github.com/tianwen7252/tianwen7252.github.io/commit/379ffbef7ba564b94205724fe7aad9419fe7e394))
- implement staff clock-in feature and upgrade dependencies ([598fe19](https://github.com/tianwen7252/tianwen7252.github.io/commit/598fe19714f742ffc938b0e616cd66a13b510156))
- improve bundle size and tree-shacking for mathjs and lodash ([bc88345](https://github.com/tianwen7252/tianwen7252.github.io/commit/bc88345c695fafa0ff0884b1dc3ad3cc6d742d5b))
- improve keyboard buttons size ([f6678e5](https://github.com/tianwen7252/tianwen7252.github.io/commit/f6678e5dcd53612d2c7e112d74630f208413cf7d))
- improve keyboard UI ([9d94603](https://github.com/tianwen7252/tianwen7252.github.io/commit/9d946036ca715ac992a67348dc6596080132acdd))
- improve order list ([380f6a7](https://github.com/tianwen7252/tianwen7252.github.io/commit/380f6a73bb8110404e40b9692c60467851e0acb6))
- improve order list styles ([47523d3](https://github.com/tianwen7252/tianwen7252.github.io/commit/47523d36106bc0e37bd0faea8df5c2999bd7a321))
- initialize home page ([eca4892](https://github.com/tianwen7252/tianwen7252.github.io/commit/eca4892e13b66bed65e48cf5e244a264884969f5))
- integrate Release Please for automated versioning ([e5a529b](https://github.com/tianwen7252/tianwen7252.github.io/commit/e5a529b19c1219a7bbf4048266badd6b687f958c))
- keyboard implementation ([149dff2](https://github.com/tianwen7252/tianwen7252.github.io/commit/149dff2a6aca7cb36569304422ea467f6c8ddb2b))
- **keyboard:** connecting api data ([bd5808a](https://github.com/tianwen7252/tianwen7252.github.io/commit/bd5808ac170b73e1398292eed33753b0dba98055))
- **keyboard:** UI adjustment from feedback and ipad app improvement ([4f458e4](https://github.com/tianwen7252/tianwen7252.github.io/commit/4f458e486183577254d778724c4a35428b6eec0e))
- merged the same meals in order list ([275e140](https://github.com/tianwen7252/tianwen7252.github.io/commit/275e1406a7dc93a7feec678430376f9f3cf046c3))
- migrate Jira integration from jira-utils.js hooks to Atlassian MCP ([b116228](https://github.com/tianwen7252/tianwen7252.github.io/commit/b11622885537011bdf681d94090f12f570d3d595))
- migrate package manager from npm to pnpm ([30e5913](https://github.com/tianwen7252/tianwen7252.github.io/commit/30e591395ef93f5fee2c9db3010e17b73c970a19))
- new icon and new comm prices ([c4fa74d](https://github.com/tianwen7252/tianwen7252.github.io/commit/c4fa74d0223d7b46dba4f1cda44a4c7853596548))
- new manifest script ([cec28cf](https://github.com/tianwen7252/tianwen7252.github.io/commit/cec28cfde778d12f9194804779aaadc576932045))
- new stickyheader and bug fixes ([5a9966e](https://github.com/tianwen7252/tianwen7252.github.io/commit/5a9966e7b6d9f623b8dc8ebafa9bc62c8fd8ba02))
- new UI adjustment ([292b869](https://github.com/tianwen7252/tianwen7252.github.io/commit/292b86952e7f4a36d37c463afc3939ae702c6183))
- new version ([e867339](https://github.com/tianwen7252/tianwen7252.github.io/commit/e86733955ec6c913b96d29279fb7452980b93f7f))
- now total is editable ([5be2a09](https://github.com/tianwen7252/tianwen7252.github.io/commit/5be2a094e1f1efd9f390f6a9074075db2f82aa08))
- order drawer implementation ([c0a5e4a](https://github.com/tianwen7252/tianwen7252.github.io/commit/c0a5e4af4f839d339c7bd0410e7a1c3d48d5bc07))
- order list page initializaion ([180f0c3](https://github.com/tianwen7252/tianwen7252.github.io/commit/180f0c30f7dbb728d617349624fb8237660aab2b))
- order list pagination ([7dca89f](https://github.com/tianwen7252/tianwen7252.github.io/commit/7dca89fa101a302d00554e17b9d03a8b709f52b9))
- orders generator ([0534c3d](https://github.com/tianwen7252/tianwen7252.github.io/commit/0534c3db43596a7c290e68c08f2197c2e67e1c62))
- prepare electron ([193657a](https://github.com/tianwen7252/tianwen7252.github.io/commit/193657a03deafaf4dc7b8197619b6f125b674a8d))
- PWA support ([6947590](https://github.com/tianwen7252/tianwen7252.github.io/commit/69475906ea0cff68465ef4b1ede3b737be5b295e))
- removing the meal name guess ([815705a](https://github.com/tianwen7252/tianwen7252.github.io/commit/815705a58051be88b525371d596f75e47e71a6e1))
- restructure components and pages and initizlize setting pages ([bf3698d](https://github.com/tianwen7252/tianwen7252.github.io/commit/bf3698d352bf6430fbb22146b4fe3fba928e3424))
- separated order page and keyboard ([3884396](https://github.com/tianwen7252/tianwen7252.github.io/commit/3884396a0c31132dc8c7b03d7e882eea6538a184))
- **settings:** add order types and adjust some code ([69722cd](https://github.com/tianwen7252/tianwen7252.github.io/commit/69722cd8b982ce6e8bee182bc4f49d12f5711b7a))
- the init version ([6f812bc](https://github.com/tianwen7252/tianwen7252.github.io/commit/6f812bc4e8df1c98934d8b81c3788d08419fa395))
- try to update ios icon ([ddc5851](https://github.com/tianwen7252/tianwen7252.github.io/commit/ddc585114a5c40a9c1b9fb7772815c8a7276a803))
- update order scheme and API ([614fe81](https://github.com/tianwen7252/tianwen7252.github.io/commit/614fe816f85056dce13eecec5832bdf117b06815))

### Bug Fixes

- add node type reference to manifest.ts for TypeScript build ([725afc9](https://github.com/tianwen7252/tianwen7252.github.io/commit/725afc92e49c0390558d01c92f04b0cbabb31819))
- add safeTransition for Jira status resilience and document full status flow ([37ee6b5](https://github.com/tianwen7252/tianwen7252.github.io/commit/37ee6b507a76fce0fda88745be4231f2a0307ea9))
- adding mathjs dependencies to avoid source code missing ([d521031](https://github.com/tianwen7252/tianwen7252.github.io/commit/d521031a599c77a25dd8b456bc79734a76243c07))
- adjust 404.html ([4a72c7e](https://github.com/tianwen7252/tianwen7252.github.io/commit/4a72c7e3f8913f51d12ad6e6ec696287c3ffb0ed))
- adjust button font size ([b7b0027](https://github.com/tianwen7252/tianwen7252.github.io/commit/b7b00272b8851612056025d4c935674981bbedd8))
- adjust more ipad css ([b3142cf](https://github.com/tianwen7252/tianwen7252.github.io/commit/b3142cff041a6ab01abc6208e23db56dad596ff5))
- adjust UI for ipad 10 ([4ff48fe](https://github.com/tianwen7252/tianwen7252.github.io/commit/4ff48fe1eb99526285981f9c2221e5b1593d83ee))
- adjust UI for ipad 10 ([93057d4](https://github.com/tianwen7252/tianwen7252.github.io/commit/93057d4a8e72c06ffd3e7aaf74810e7f25d0b9d6))
- amend npm scripts ([9f9eb96](https://github.com/tianwen7252/tianwen7252.github.io/commit/9f9eb96e3ed0a0fb0056745b681054e75cf4f8ab))
- bug fix and add new commondities ([e2995a5](https://github.com/tianwen7252/tianwen7252.github.io/commit/e2995a503155fcdc7ee3d9070e54d70fa7c04bec))
- bug fix of total edition ([164d806](https://github.com/tianwen7252/tianwen7252.github.io/commit/164d8064fd38390b690f4c029705026fb3bb5b40))
- bug fix where the edited total should work with same price ([cc7516e](https://github.com/tianwen7252/tianwen7252.github.io/commit/cc7516e139055ed3574fae78b2be7ad6350a63f2))
- bug fixes ([9aac550](https://github.com/tianwen7252/tianwen7252.github.io/commit/9aac550f5b586d1c199f64206cdbf7cede56cc67))
- correct last record number and the order list sort ([1c3386a](https://github.com/tianwen7252/tianwen7252.github.io/commit/1c3386a90d3ab13967fb2c6aae7de63ba42d4e9d))
- correct the dates on title on order list page ([888e0a9](https://github.com/tianwen7252/tianwen7252.github.io/commit/888e0a942efd95f22ec548f1bc0be4093f8f2360))
- import Interpolation from @emotion/react instead of @emotion/serialize ([f16b1b9](https://github.com/tianwen7252/tianwen7252.github.io/commit/f16b1b9ed0ee8394ea81f7422efcfb35ec619b8c))
- improve build settings ([e41ff4b](https://github.com/tianwen7252/tianwen7252.github.io/commit/e41ff4b279e4909657bab3b6a270ffb01082b2ce))
- **keyboard, order, stats:** connect APIs and fix bugs ([759216a](https://github.com/tianwen7252/tianwen7252.github.io/commit/759216a0d2323312bd4ea37240a8f97251b7303d))
- PM time correction ([54524d3](https://github.com/tianwen7252/tianwen7252.github.io/commit/54524d3196c84b3b6750b086f1997b1ceb3bdf37))
- reduce keyboard mode ([332b91b](https://github.com/tianwen7252/tianwen7252.github.io/commit/332b91bf25da6c5d18cc7c0a6489653838e94008))
- release a test version 0.0.1 ([042d71b](https://github.com/tianwen7252/tianwen7252.github.io/commit/042d71b1e6251b19e6a311a84a8ff5ec6ae33557))
- remove settings.local.json ([7cdd77d](https://github.com/tianwen7252/tianwen7252.github.io/commit/7cdd77df596f411af239b7c85b97de5b553498f4))
- resolve CI lint errors and allow warnings in lint config ([835c820](https://github.com/tianwen7252/tianwen7252.github.io/commit/835c82024532f4c047c248af042db647851f7adf))
- resolve ESLint arrow-parens errors in E2E test files ([496a9d5](https://github.com/tianwen7252/tianwen7252.github.io/commit/496a9d512fc2d02dc7e68d5a5062b70a515807e3))
- resolve flaky E2E tests and CI report artifact ([d27c6ba](https://github.com/tianwen7252/tianwen7252.github.io/commit/d27c6ba73386e805de55dfb0b8f31c7bbb20bb22))
- resolved bundle issue ([2c8aff2](https://github.com/tianwen7252/tianwen7252.github.io/commit/2c8aff272677ede92d37139ec41610919e2aa265))
- show edit mode correctly after scrolling on order list page ([11efcd9](https://github.com/tianwen7252/tianwen7252.github.io/commit/11efcd9576b93982139552b3ede53c3e2f18b547))
- soups were not correct ([60183e9](https://github.com/tianwen7252/tianwen7252.github.io/commit/60183e923bc31338a11bd5a6cd3aa8a3907e4608))
- submit a new version ([2c99125](https://github.com/tianwen7252/tianwen7252.github.io/commit/2c99125f28113044d7b1cdee3d686de7ee0f02c5))
- try to fix bundle issue ([49159e0](https://github.com/tianwen7252/tianwen7252.github.io/commit/49159e0e23bf1b993fa5c13f84563d8179f89cb1))
- unify AuthGuard login flow so StaffAdmin and Backup share auth state ([44793ca](https://github.com/tianwen7252/tianwen7252.github.io/commit/44793ca2892b92e899f991e9ee417aa933242784))
- update commondities ([af81918](https://github.com/tianwen7252/tianwen7252.github.io/commit/af81918e3621cb08c1ca6bf0351196a903256fbf))
- update index and 404 html ([e9df688](https://github.com/tianwen7252/tianwen7252.github.io/commit/e9df6885c27ce9bd605c65797699f5c46a370d46))
- update manifest ([d600997](https://github.com/tianwen7252/tianwen7252.github.io/commit/d6009979c8d5e3cfbe40d94811b611e939510eed))
- update repo name ([97a12ca](https://github.com/tianwen7252/tianwen7252.github.io/commit/97a12cabf2c3b9f8b2c767f170bec3ad66304973))
- update start_url ([9f06847](https://github.com/tianwen7252/tianwen7252.github.io/commit/9f06847c6ed54ba097ba8ca52e3eb0a944b84552))
- update tests to fix CI failures and remove stale snapshots ([4e1d60c](https://github.com/tianwen7252/tianwen7252.github.io/commit/4e1d60c9f1ae0e12624da6c5dc4dc0bed8ae4753))
- upgrade @types/node to ^24 and add .npmrc legacy-peer-deps for CI compatibility ([5cafd2c](https://github.com/tianwen7252/tianwen7252.github.io/commit/5cafd2c7ec9ca1b70dd339b4d08e274e53b1ded5))
- use --max-warnings 9999 instead of -1 for ESLint compatibility ([349ccfd](https://github.com/tianwen7252/tianwen7252.github.io/commit/349ccfd952c56df3cc6544d31b57981535a618c9))
- v0.0.18 ([97540ee](https://github.com/tianwen7252/tianwen7252.github.io/commit/97540ee09e787221d1421ecea8aaace9f11fbd16))
