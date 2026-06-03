# 基本サンプル

`assets/` に以下のファイルを配置してからローカルサーバーで開いてください。

```
examples/basic/
├── index.html
├── ar-config.js
└── assets/
    ├── models/character.glb   ← あなたの GLB モデル
    ├── markers/marker.png     ← マーカー画像（MindAR Compiler の入力と同じ）
    └── targets/targets.mind   ← MindAR Compiler で生成
```

## 起動方法

```bash
# リポジトリルートで
npx serve .
```

ブラウザで `http://localhost:3000/examples/basic/` を開き、**スマートフォン**のブラウザで同じ URL にアクセスしてください（HTTPS または同一 LAN 上の PC IP アドレス）。

> WebAR はカメラ API の制約により、スマートフォン + HTTPS（または localhost）が必要です。

## 次のステップ

- [MindAR ガイド](../../docs/mindar-guide.md) — `.mind` ファイルの作り方
- [モデル準備ガイド](../../docs/model-preparation.md) — GLB の最適化
- [テンプレート](../../template/) — 新規プロジェクトの雛形
