# 錯誤紀錄與排解報告 (Errors & Fixes)

記錄開發與設定過程中遭遇之問題、原因分析及對應解決方案。

---

## 1. CSS 選擇器繼承錯誤導致輸入方塊異常膨脹

- **發生時間**：2026-09-11
- **問題現象**：
  在將全站文字改為「標楷體」後，畫面格式嚴重跑版，文字輸入方塊垂直異常拉伸成佔滿整個瀏覽器螢幕高度（100vh）的巨大方塊，按鈕與查詢結果被往下推擠。
- **原因分析**：
  在 CSS 樣式表中宣告字型時，合併使用了如下選擇器：
  ```css
  body, button, input, select, textarea {
    font-family: var(--font-kai) !important;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    ...
  }
  ```
  導致 `<input>` 和 `<button>` 意外繼承了僅供 `body` 使用的 `min-height: 100vh` 與 `display: flex` 屬性。
- **修正方式**：
  1. 將字型宣告與 `body` 版面屬性嚴格拆開：
     ```css
     *, button, input, select, textarea {
       font-family: var(--font-kai);
     }
     body {
       font-family: var(--font-kai) !important;
       min-height: 100vh;
       display: flex;
       flex-direction: column;
     }
     ```
  2. 為 `.search-input` 與 `.btn-search` 明確定義單行高度 `height: 60px` 與 `box-sizing: border-box`，並將外層容器設為 `align-items: center` 垂直置中。

---

## 2. PowerShell 無法辨識 Git 執行檔路徑

- **發生時間**：2026-09-11
- **問題現象**：
  在終端機中執行 `git init` 時，PowerShell 拋出錯誤：
  `無法辨識 'git' 詞彙是否為 Cmdlet、函數、指令檔或可執行程式的名稱 (CommandNotFoundException)`。
- **原因分析**：
  1. 系統安裝的是圖形化介面的 GitHub Desktop，其內建的 `git.exe` 存放在內部子目錄（`...\GitHubDesktop\app-...\resources\app\git\cmd\`），未自動登記至系統環境變數 `PATH`。
  2. 使用者即便透過指令將路徑寫入註冊表之環境變數，已開啟中的 PowerShell 視窗記憶體仍維持舊有的環境變數，不會即刻自動重載。
- **修正方式**：
  1. 定位 `git.exe` 的實際存放路徑，將其新增至使用者的 `PATH` 環境變數。
  2. 指引使用者關閉並重新開啟 PowerShell 視窗，使系統完整載入更新後的 `PATH`；或在當前終端機工作階段直接更新 `$env:Path`。

---

## 3. Git 首次提交因身分未設定中斷與遠端分支名稱不符

- **發生時間**：2026-09-11
- **問題現象**：
  執行 `git commit -m "..."` 時出現 `Author identity unknown: fatal: unable to auto-detect email address`；接續執行 `git push -u origin master` 時出現 `error: src refspec master does not match any`。
- **原因分析**：
  1. 本地端 Git 尚未設定 `user.name` 與 `user.email`，Git 因無法識別提交作者身分而終止 commit，導致本地端實質上尚未產生任何 commit 紀錄。
  2. 本地預設主分支名稱已初始化為 `main`，而非舊版的 `master`；在尚無 commit 的狀態下推送到 `master` 便會發生 `src refspec does not match any`。
- **修正方式**：
  1. 執行身分設定指令，配置指定的帳號名稱與指定的 Email：
     ```powershell
     git config --global user.name "指定的帳號名稱"
     git config --global user.email "指定的Email"
     ```
  2. 重新執行 `git commit -m "..."` 建立版本紀錄。
  3. 將推送目標分支由 `master` 改為 `main`：
     ```powershell
     git push -u origin main
     ```
