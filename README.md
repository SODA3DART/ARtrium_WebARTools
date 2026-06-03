# ARtrium WebAR Tools

**IT スキルがなくても、Web ブラウザ上で「飛び出す AR」を作れるエディタです。**

3D モデル（GLB）と MindAR データ（`.mind`）をアップロードするだけで、  
`index.html` などが一式入った ZIP をダウンロードできます。

## できること

- マーカー画像 + `.mind` + GLB をアップロード
- タイトル・モデルの大きさなどを GUI で設定
- **Three.js 3D プレビュー** — 位置・回転・スケールをギズモで調整
- **ZIP 一発ダウンロード** — 解凍して Web サーバーに置くだけで AR 公開可能
- プログラミング不要

## Editor の使い方

### Windows の方（いちばんかんたん）

1. **初回だけ** → `初回セットアップ（Node.js）.bat` をダブルクリックし、画面の指示どおり Node.js をインストール（無料）
2. **いつも** → `エディタを起動.bat` をダブルクリック
3. ブラウザが自動で開く → ファイルをアップロードして ZIP をダウンロード
4. ダウンロードした ZIP を `projects/` に入れ、**`ZIPからスマホで見る.bat`** で解凍・QR・スマホ試用
5. 終わったら黒い画面（コマンドプロンプト）を閉じる

くわしい手順は **`使い方.txt`** を参照してください。

### その他の OS / 上級者向け

Editor はブラウザからライブラリを読み込むため、ローカルサーバーが必要です。

```bash
git clone https://github.com/SODA3DART/ARtrium_WebARTools.git
cd ARtrium_WebARTools
npx serve .
```

ブラウザで **http://localhost:3000/editor/** を開きます。

### 2. ファイルを用意

| ファイル | 説明 | 作り方 |
|----------|------|--------|
| マーカー画像 | カメラで認識させる画像 | ポスター・イラスト・ロゴなど |
| `.mind` | MindAR ターゲット | [MindAR Compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile) でマーカー画像から生成 |
| `.glb` | 3D モデル | Blender 等から書き出し |

Editor 内に MindAR Compiler へのリンクと手順が表示されます。

### 3. アップロード → ZIP ダウンロード

1. マーカー画像をアップロード
2. `.mind` をアップロード
3. GLB をアップロード
4. **Step 4** で 3D プレビュー上のギズモを使い、モデルの位置・回転・大きさを調整
5. （任意）表示設定を調整
6. **「ZIP ダウンロード」** をクリック

### 4. ZIP の中身

```
my-ar-webar.zip
├── index.html          ← スマホで開く AR ページ
├── ar-config.js        ← 設定（上級者向け）
├── README.txt          ← 公開・体験方法
├── lib/                ← AR 実行ライブラリ
└── assets/
    ├── models/character.glb
    ├── markers/marker.png
    └── targets/targets.mind
```

解凍後、フォルダ内で `npx serve .` を実行するか、同梱の **`ARをスマホで試す（ngrok）.bat`**（Windows）でスマートフォンから体験できます。

## スマホで試す・インターネット公開

| 方法 | ファイル / ドキュメント | 用途 |
|------|-------------------------|------|
| **ZIP → スマホ** | `ZIPからスマホで見る.bat` | ZIP を `projects/` に入れて解凍・QR・ngrok 一括 |
| **ngrok** | `スマホで試す（ngrok）.bat` | エディタ or 完成 AR をすぐスマホで試す |
| **ngrok 初回** | `初回セットアップ（ngrok）.bat` | ngrok インストール・Authtoken 設定 |
| **GitHub Pages** | [docs/publish-guide.md](docs/publish-guide.md) | 恒久 URL で本番公開（無料） |

くわしい手順は **[docs/publish-guide.md](docs/publish-guide.md)** と **`使い方.txt`** を参照してください。

## リポジトリ構成

```
ARtrium_WebARTools/
├── ZIPからスマホで見る.bat   ★ ZIP 解凍 + QR + ngrok
├── projects/                 … ダウンロードした ZIP をここに置く
├── editor/                 ★ Web AR エディタ（メイン）
│   ├── index.html
│   ├── app.js
│   ├── scene-editor.js     Three.js 3D レイアウトエディタ
│   ├── packager.js         ZIP 生成ロジック
│   └── editor.css
├── lib/                    AR 実行時ライブラリ（ZIP に同梱）
├── template/               手動セットアップ用テンプレート
├── examples/basic/         開発者向けサンプル
└── docs/
    ├── mindar-guide.md     MindAR 詳細ガイド
    ├── model-preparation.md
    └── publish-guide.md    GitHub Pages / ngrok 公開ガイド
```

## 技術スタック

- [MindAR](https://github.com/hiukim/mind-ar-js) — 画像マーカー AR
- [A-Frame](https://aframe.io/) — WebGL / WebXR
- [JSZip](https://stuk.github.io/jszip/) — ブラウザ内 ZIP 生成

## 元プロジェクト

専門学校 Soda3DART 3年生の WebAR 展示「**飛び出す!ARキャラクター**」の技術を OSS 化したものです。

## オープンソース・免責事項

- 本プログラムは **OSS（オープンソースソフトウェア）** です。
- 本プログラムの **改変・再配布・商用利用等は自由** に行っていただいて構いません（MIT License に従う場合を含みます）。
- ただし、本プログラムの利用・改変・配布等により **発生したいかなる問題についても、作者・提供者は一切の責任を負いません**。ご利用は自己責任でお願いします。
- **不具合・要望・質問** は [GitHub Issues](https://github.com/SODA3DART/ARtrium_WebARTools/issues) に記載してください。

## ライセンス

[MIT License](LICENSE)

## 著作権表示

**崇城大学芸術学部美術学科 3Dアートコース © Soda3DART 2026**

## 今後の予定

Editor で生成した ZIP のワンクリック GitHub Pages 公開などは別途検討予定です。  
現時点では **ngrok bat**（一時試用）または **GitHub Pages**（本番公開）をご利用ください。
