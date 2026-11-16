# 許芳瑜｜個人專案作品集

以 Astro 建立的繁體中文靜態作品集。網站由 `content/` 的 Markdown／YAML 產生首頁、案例卡片與獨立案例頁；新增案例不需要複製頁面程式碼。視覺依 `docs/design-spec.md` 採 B 配色、無照片開場、編輯式排版與滾動首頁。

- GitHub Repository：https://github.com/s411283037/portfolio-content
- 公開網站：https://s411283037.github.io/portfolio-content/

## 技術與資料結構

- Astro 靜態輸出；`src/content.config.ts` 定義各類 Markdown schema。
- `content/profile.yaml` 與 `content/skills.yaml` 為結構化資料；案例、經歷、學歷、證照各自保存 Markdown。
- `src/components/` 與 `src/layouts/` 提供共用卡片、時間軸、導覽與版型。
- `scripts/validate-content.mjs` 驗證必要欄位、id、狀態、技能與公開關聯、案例章節及素材路徑。
- 只有 `status: published` 會進入正式輸出；首頁精選另由 `featured` 與 `order` 控制。

## 已驗證指令

```powershell
npm install
npm run validate
npm run check
npm run build
npm run verify
npm run dev -- --host 127.0.0.1
```

開發預覽預設為 `http://127.0.0.1:4321/`。正式靜態檔輸出至 `dist/`。

本專案已設定 GitHub Pages 子路徑 `/portfolio-content`，推送到 `main` 後由 `.github/workflows/deploy.yml` 自動建置與部署。如需在其他 repository 測試，可暫時覆寫：

```powershell
$env:BASE_PATH='/repository-name'
npm run build
```

## 新增案例

1. 複製 `templates/project.md` 到 `content/projects/<id>.md`，保持 `status: draft`。
2. 補入已確認的內容；圖片放到 `public/assets/projects/<id>/`，並提供替代文字與公開狀態。
3. 執行 `npm run validate`。完成公開最低條件後改為 `status: published`；只有首頁精選才設 `featured: true`。
4. 執行 `npm run build`。案例將自動產生 `/projects/<id>/`，不需修改路由或複製版型。

`npm run verify` 會額外檢查 `dist/` 內部連結與草稿隔離。

未確認資料維持 `null` 或 draft，待補事項見 `docs/pending-items.md`。目前未推送 GitHub、未公開部署。
