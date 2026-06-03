# GLB モデル準備ガイド

WebAR 向けに 3D モデルをエクスポート・最適化する際のポイントです。

## 推奨フォーマット

- **GLB**（バイナリ glTF）— テクスチャ込みで1ファイル、Web 配信に最適
- ファイルサイズ目安: **5 MB 以下**（10 MB 超は読み込みに時間がかかる）

## Blender からのエクスポート

1. File → Export → glTF 2.0 (.glb/.gltf)
2. 推奨設定:
   - Format: **glTF Binary (.glb)**
   - Include: Selected Objects または Visible Objects
   - Transform: +Y Up（デフォルト）
   - Geometry: Apply Modifiers にチェック
   - Animation: アニメーションがある場合は **Shape Keys / Skinning** を有効化

### WebAR 向けスケール

MindAR 上では `scale="0.3 0.3 0.3"` 前後が多いです。Blender 上で大きすぎるモデル（数十メートル）は、エクスポート前に **Apply Scale** しておくと調整しやすくなります。

## アニメーション

GLB にアニメーションクリップが含まれている場合、`ar-config.js` で:

```javascript
animation: { clip: '*', loop: 'repeat' }
```

- `clip: '*'` — 全クリップを再生
- `clip: 'Walk'` — 特定クリップ名を指定

## 輪郭線（アウトライン）付きモデル

Soda3DART の作品では、キャラクターに輪郭線メッシュが含まれることがあります。ARtrium の `doubleSided: true` は、裏面カリングによる欠けを防ぎます。マテリアル名やメッシュ名に `outline` が含まれる部分は片面表示のまま扱います。

ソリッドワイヤーフレーム表示を試す場合:

```javascript
wireframe: true
```

UI の「ソリッドWF」ボタンで切り替えできます。

## テクスチャ

- テクスチャは GLB にベイク（埋め込み）する
- 解像度: 1024×1024 以下を推奨（2048 は大きいモデル向け）
- 透過 PNG は使えるが、描画順の問題が出る場合は `doubleSided: true` を試す

## 最適化ツール

| ツール | 用途 |
|--------|------|
| [glTF Transform](https://gltf-transform.dev/) | Draco 圧縮、リサイズ、不要データ削除 |
| [Blender Decimate](https://docs.blender.org/) | ポリゴン数削減 |
| [RapidCompact](https://rapidcompact.com/) | 自動最適化（商用あり） |

```bash
# gltf-transform の例
npm install -g @gltf-transform/cli
gltf-transform optimize input.glb output.glb --compress draco
```

## 複数モデル（キャラ + ステージ）

```javascript
models: [
  {
    id: 'stage',
    src: 'assets/models/stage.glb',
    rotation: '90 0 0',
    scale: '0.3 0.3 0.3',
    animation: { clip: '*', loop: 'repeat' }
  },
  {
    id: 'character',
    src: 'assets/models/character.glb',
    rotation: '90 0 0',
    position: '0 0 0.5',
    scale: '0.3 0.3 0.3',
    animation: { clip: '*', loop: 'repeat' },
    doubleSided: true,
    wireframe: true
  }
]
```

ステージとキャラクターで `position` / `scale` を個別に調整してください。

## ポスターモード vs 立体モード

「飛び出す AR」では2つの見せ方を切り替えられます。

- **立体モード（stand）**: モデルを90度倒して、マーカーから“飛び出す”ように見せる
- **ポスターモード（poster）**: マーカー平面に沿って表示（ポスターそのものの延長）

モデルによって最適な `rotation` が異なります。`ar-config.js` の `ui.posterMode` または各モデルの `posterMode` で調整してください。
