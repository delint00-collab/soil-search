# 土売場検索 分割版

この版は、最新の完成版
`soil-search_toggle-flip_2px_fixedlabel.html`
を元に分割したものです。

## 普段編集するファイル

基本的に **data.js だけ** 編集します。

### 1商品

```js
"骨粉入り油粕 10kg"
```

### 1マスに複数商品

```js
[
  "ねぎ・玉ねぎの肥料 5kg",
  "おいしいじゃがいも・さといもの肥料 5kg",
  "バットグアノ 5kg"
]
```

商品数に応じて自動で等分されます。
区切り線は Firefox でも見えるよう **2px** です。

### 空きマス

```js
""
```

### 縦2マスを結合

```js
{
  "items": ["花と野菜の循環型培養土 25L"],
  "rowSpan": 2
}
```

その直下のマスは `null` のままにします。

## ファイル構成

- `index.html` … ページ本体
- `style.css` … 見た目
- `data.js` … 商品データ
- `app.js` … 検索・表示・反転処理
- `preview.html` … スマホなどで単体確認するための1ファイル版

## GitHub Pages

本番では次の4ファイルを同じフォルダに置きます。

```text
index.html
style.css
data.js
app.js
```

`preview.html` は本番には不要です。
