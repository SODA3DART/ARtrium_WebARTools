# AR の公開・スマホでの試し方ガイド

WebAR は **HTTPS**（または localhost）が必要です。  
IT が苦手な方は **ngrok（一時的）** または **GitHub Pages（本番公開）** を使うのがおすすめです。

---

## 方法 A: ZIP からスマホで見る（Windows・いちばんかんたん）

**向いている人:** Editor で ZIP をダウンロードしたあと、解凍や URL コピーなしでスマホ試用したい

### 手順

1. ダウンロードした `○○-webar.zip` を **`projects/`** フォルダに入れる
2. **`ZIPからスマホで見る.bat`** をダブルクリック  
   （または ZIP を bat ファイルにドラッグ＆ドロップ）
3. 自動で **解凍** → **ngrok URL 発行** → **QR コードページ**が開く
4. スマホで QR を読み取る → カメラ許可 → マーカーを映す
5. 終わったら黒い画面で **Enter** → 停止

展開先: `projects/○○-webar/`  
QR ページ: `projects/○○-webar/_スマホで開く（QR）.html`

---

## 方法 B: ngrok でスマホですぐ試す（エディタ／単体フォルダ）

**向いている人:** 作った AR をすぐスマホで試したい、同一 Wi-Fi がなくても試したい

### 初回セットアップ（1回だけ）

1. **`初回セットアップ（ngrok）.bat`** をダブルクリック
2. [ngrok](https://ngrok.com/) で無料アカウント作成
3. Windows 版 `ngrok.exe` をダウンロードし、ARtrium フォルダに置く
4. 画面の指示どおり **Authtoken** を設定

### エディタをスマホで試す

1. **`スマホで試す（ngrok）.bat`** をダブルクリック
2. 黒い画面に **https://xxxx.ngrok-free.app/editor/** のような URL が表示される
3. その URL をスマホの Chrome / Safari に入力
4. 終わったら黒い画面を閉じる（URL は無効になります）

### 完成した AR（ZIP）をスマホで試す

1. Editor からダウンロードした ZIP を解凍
2. フォルダ内の **`ARをスマホで試す（ngrok）.bat`** をダブルクリック
3. 表示された URL（例: `https://xxxx.ngrok-free.app/`）をスマホで開く
4. カメラを許可 → マーカー画像を映す

### ngrok の注意点

| 項目 | 内容 |
|------|------|
| 無料 | 個人利用は無料（アカウント必要） |
| URL | 起動のたびに変わる |
| 停止 | bat の黒い画面を閉じると URL は使えなくなる |
| 初回 | ngrok の警告画面が出ることがある → 「Visit Site」をタップ |

---

## 方法 C: GitHub Pages で本番公開（無料・恒久 URL）

**向いている人:** 完成した AR を URL 固定で公開したい、SNS 等で共有したい

### 必要なもの

- [GitHub](https://github.com/) アカウント（無料）
- 完成した AR フォルダ（Editor から ZIP ダウンロード → 解凍）

### 手順

#### 1. GitHub にリポジトリを作る

1. GitHub にログイン
2. 右上 **「+」→ New repository**
3. Repository name: 例 `my-ar-project`（半角英数字）
4. **Public** を選択 → **Create repository**

#### 2. ファイルをアップロード

1. 作成したリポジトリのページで **「uploading an existing file」** をクリック  
   （または **Add file → Upload files**）
2. ZIP を解凍したフォルダの**中身すべて**をドラッグ＆ドROP  
   - `index.html`
   - `ar-config.js`
   - `lib/` フォルダ
   - `assets/` フォルダ
3. 下の **Commit changes** をクリック

#### 3. GitHub Pages を有効化

1. リポジトリの **Settings** タブ
2. 左メニュー **Pages**
3. **Source** → **Deploy from a branch**
4. **Branch** → `main` / `/ (root)` → **Save**
5. 1〜2 分待つ

#### 4. URL を確認

Pages 設定画面に表示される URL:

```
https://あなたのユーザー名.github.io/my-ar-project/
```

この URL をスマホで開けば AR 体験できます。

### GitHub Pages の注意点

| 項目 | 内容 |
|------|------|
| URL | 変わらない（恒久） |
| HTTPS | 自動対応（AR に必要） |
| 更新 | ファイルを再アップロード or git push |
| 公開 | Public リポジトリなら誰でもアクセス可能 |

### ファイル更新のしかた

同じリポジトリで **Add file → Upload files** から上書きアップロードするか、  
GitHub Desktop 等で push します。

---

## 方法 D: 同一 Wi-Fi 内で試す（ngrok なし）

**向いている人:** PC とスマホが同じ Wi-Fi にいる

1. AR フォルダで `npx serve .` を実行（または `エディタを起動.bat`）
2. PC の IP アドレスを調べる  
   - Windows: コマンドプロンプトで `ipconfig` → IPv4 アドレス
3. スマホで `http://192.168.x.x:3000/` を開く

※ `http` のため環境によってはカメラが使えない場合があります。  
その場合は **ngrok** または **GitHub Pages** を使ってください。

---

## どれを選ぶ？

| 目的 | おすすめ |
|------|----------|
| 今すぐスマホで試したい（ZIP 直後） | **ZIPからスマホで見る.bat** |
| エディタ作業中にスマホ確認 | **スマホで試す（ngrok）.bat** |
| URL を人に配りたい | **GitHub Pages** |
| 授業・展示で一時的に | **ngrok** |
| 作品集・ポートフォリオ | **GitHub Pages** |

---

## トラブルシューティング

### スマホでカメラが起動しない

- HTTPS（`https://`）で開いているか確認
- ブラウザのカメラ許可を確認
- Chrome / Safari を使用（アプリ内ブラウザは不可な場合あり）

### ngrok の URL が表示されない

- `初回セットアップ（ngrok）.bat` で Authtoken を設定したか
- `ngrok.exe` が ARtrium フォルダにあるか、PATH が通っているか
- 黒い画面を 10 秒ほど待ってから確認

### GitHub Pages で 404

- `index.html` がリポジトリのルートにあるか
- Pages の Branch 設定が `main` / root か
- 反映まで 1〜2 分待つ

---

## 関連ファイル

| ファイル | 用途 |
|----------|------|
| `ZIPからスマホで見る.bat` | ZIP 解凍 + QR + ngrok 一括 |
| `スマホで試す（ngrok）.bat` | エディタをスマホで試す |
| `ARをスマホで試す（ngrok）.bat` | 完成 AR をスマホで試す（ZIP 同梱） |
| `初回セットアップ（ngrok）.bat` | ngrok 初回設定 |
| `使い方.txt` | 全体の使い方 |
