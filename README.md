# 台北市民 48 問

將[黃暐瀚的 Facebook 整理貼文](https://www.facebook.com/share/p/19x1PjGU3N/)做成可搜尋、可依主題篩選的單頁閱讀網站。保留原文的 48 個提問與其附帶的整理文字，沒有附帶回答的題目會明確標示。

這是原貼文的閱讀介面，不是候選人官方網站；貼文中的說法未由本站獨立查證。

## 本機預覽

需要 Node.js 20 或更新版本。此專案沒有 npm 套件依賴。

```sh
npm run dev
```

打開 http://127.0.0.1:3000。

## 建置

```sh
npm run build
```

靜態網站輸出於 `dist/`。`vercel.json` 已設定 build command 與 output directory；需要公開部署時，可在 Vercel 匯入此 Git 儲存庫。此專案尚未與 Vercel 帳號或專案連結。

題目資料在 `data.json`。`scripts/extract-post.rb` 是從 Facebook 公開 embed 的 HTML 重新產生資料的輔助程式；日常建置不需要執行它。
