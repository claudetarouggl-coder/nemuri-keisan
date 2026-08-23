"use strict";
// 楽天アフィリエイト（専用楽天アカウント）。検索リンクはID固定・pc=差し替えで構築
const LINK_ID = "56939e6e.b614e71e.56939e6f.e56659e4";
const UT = "eyJwYWdlIjoidXJsIiwidHlwZSI6InRleHQiLCJjb2wiOjF9";
const searchLink = keyword =>
  `https://hb.afl.rakuten.co.jp/hgc/${LINK_ID}/?pc=${encodeURIComponent(`https://search.rakuten.co.jp/search/mall/${keyword}/`)}&link_type=text&ut=${UT}`;

// 快眠ガイド用の定番アイテム
const KAIMIN_GOODS = [
  { label: "肩こり対応 枕", keyword: "枕 肩こり", note: "高さや硬さが合わないと寝つき・寝返りに影響するとされる定番の見直しポイント" },
  { label: "高反発マットレス", keyword: "マットレス 高反発", note: "寝具の硬さの好みは人それぞれですが、体圧分散をうたう定番タイプ" },
  { label: "遮光アイマスク", keyword: "アイマスク 遮光", note: "光を遮ることで入眠しやすくなるとされる手軽なアイテム" },
].map(g => ({ ...g, url: searchLink(g.keyword) }));

module.exports = { KAIMIN_GOODS, searchLink };
