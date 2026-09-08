"use strict";
// 睡眠サイクル計算 静的サイトジェネレータ
// 生成物: docs/ 以下に index.html + guide/cycle/ + guide/kaimin/ + sitemap.xml + 404.html
const fs = require("fs");
const path = require("path");
const { computeBedtimes, computeWaketimes } = require("./lib/sleepcalc");
const { KAIMIN_GOODS } = require("./lib/affiliates");

const BASE = "https://claudetarouggl-coder.github.io/nemuri-keisan/";
// 姉妹サイト相互リンク（自サイトは除外）
const RELATED_SITES = [
  ["https://claudetarouggl-coder.github.io/kyou-no-taiyo/", "きょうの太陽"],
  ["https://claudetarouggl-coder.github.io/hinode-calendar/", "日の出・日の入りカレンダー"],
  ["https://claudetarouggl-coder.github.io/furusato-keisan/", "ふるさと納税 上限額計算"],
  ["https://claudetarouggl-coder.github.io/nenrei-hayami/", "年齢早見表"],
  ["https://claudetarouggl-coder.github.io/rokuyo-calendar/", "六曜カレンダー"],
  ["https://claudetarouggl-coder.github.io/tester-match/", "テスターマッチ"],
  ["https://claudetarouggl-coder.github.io/houji-hayami/", "法事・回忌早見表"],
  ["https://claudetarouggl-coder.github.io/pet-nenrei/", "犬・猫の年齢換算"],
  ["https://claudetarouggl-coder.github.io/nemuri-keisan/", "睡眠サイクル計算"],
];
const RELATED_NAV = `<p class="related">姉妹サイト: ${RELATED_SITES.filter(([u]) => u !== BASE)
  .map(([u, n]) => `<a href="${u}" rel="noopener">${n}</a>`).join("・")}</p>`;
const GA_ID = "G-JG9K0GG6TS";
const OUT = path.join(__dirname, "docs");
const SITE_NAME = "何時に寝ればいい？睡眠サイクル計算";

const jstNow = new Date(Date.now() + 540 * 60000);
const TODAY_STR = `${jstNow.getUTCFullYear()}-${String(jstNow.getUTCMonth() + 1).padStart(2, "0")}-${String(jstNow.getUTCDate()).padStart(2, "0")}`;

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const emittedUrls = [];
const linkTargets = new Set();
const canonical = p => BASE + p;
function rel(depth, target) {
  linkTargets.add(target);
  return target ? "../".repeat(depth) + target : (depth ? "../".repeat(depth) : "./");
}

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:"Hiragino Kaku Gothic ProN","Yu Gothic",Meiryo,sans-serif;color:#e8e6f5;background:#1b1a2e;line-height:1.7}
main{max-width:860px;margin:0 auto;padding:1rem}
header.site{background:linear-gradient(135deg,#2d2a53,#4a3d7a);padding:1.2rem 1rem .9rem;text-align:center}
header.site a{color:#fff;text-decoration:none;font-weight:bold;font-size:1.05rem}
h1{font-size:1.35rem;margin:.8rem 0 .3rem;color:#fff}
h2{font-size:1.1rem;margin:1.6rem 0 .5rem;border-left:4px solid #8a7bd8;padding-left:.5rem;color:#fff}
h3{font-size:.98rem;margin:1rem 0 .3rem;color:#fff}
nav.bc{font-size:.8rem;color:#a7a2c8;margin:.5rem 0}
nav.bc a{color:#b3a7f0}
.feature,.faq,.note,.tool{background:#26244a;border:1px solid #3a3768;border-radius:10px;padding:1rem;margin:.8rem 0}
.tool h2:first-child{margin-top:0}
.toolrow{display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;margin:.6rem 0}
input[type=time]{font-size:1.1rem;padding:.4rem .6rem;border-radius:8px;border:1px solid #4a4780;background:#1b1a2e;color:#e8e6f5}
button{font-size:1rem;padding:.5rem 1.1rem;border-radius:8px;border:none;background:#8a7bd8;color:#fff;cursor:pointer;font-weight:600}
button:hover{background:#9d8fe8}
ul.result{list-style:none;margin:.6rem 0}
ul.result li{background:#1b1a2e;border:1px solid #3a3768;border-radius:8px;padding:.6rem .9rem;margin:.4rem 0;display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap}
ul.result .time{font-size:1.3rem;font-weight:bold;color:#b3a7f0}
ul.result .sub{font-size:.82rem;color:#a7a2c8}
.tbl{overflow-x:auto;background:#26244a;border:1px solid #3a3768;border-radius:10px;margin:.8rem 0}
table{border-collapse:collapse;width:100%;font-size:.88rem;white-space:nowrap}
th,td{padding:.4rem .6rem;text-align:center;border-bottom:1px solid #3a3768}
th{background:#302d5a;font-weight:600}
.faq dt{font-weight:600;margin-top:.6rem;color:#fff}.faq dd{margin-left:0;color:#c7c3e0}
.links{display:flex;flex-wrap:wrap;gap:.5rem;margin:.6rem 0}
.links a{background:#26244a;border:1px solid #3a3768;border-radius:999px;padding:.3rem .8rem;font-size:.85rem;text-decoration:none;color:#b3a7f0}
a{color:#b3a7f0}
.goods li{margin:.35rem 0 .35rem 1.2em}
footer{margin:2rem 0 1rem;color:#8f8ab5;font-size:.75rem;text-align:center;line-height:1.9}
.note{font-size:.88rem;color:#c7c3e0}
`.trim();

function shell({ path: pagePath, depth, title, desc, h1, breadcrumbs, body, extraHead = "", extraScript = "" }) {
  const canon = canonical(pagePath);
  emittedUrls.push(canon);
  const gtag = GA_ID ? `
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');</script>` : "";
  const bcJson = breadcrumbs.length ? `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((b, i) => ({
      "@type": "ListItem", position: i + 1, name: b.name, item: canonical(b.path),
    })),
  })}</script>` : "";
  const bcNav = breadcrumbs.length > 1 ? `<nav class="bc">${breadcrumbs.map((b, i) =>
    i === breadcrumbs.length - 1 ? esc(b.name) : `<a href="${rel(depth, b.path)}">${esc(b.name)}</a>`).join(" › ")}</nav>` : "";
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canon}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌙</text></svg>">${gtag}
${bcJson}${extraHead}
<style>${CSS}</style>
</head>
<body>
<header class="site"><a href="${rel(depth, "")}">${esc(SITE_NAME)}</a></header>
<main>
${bcNav}
<h1>${esc(h1)}</h1>
${body}
<footer>
本サイトは一般的な情報の提供を目的とし、医学的助言を行うものではありません。<br>
睡眠サイクルは平均約90分とされますが個人差が大きく、計算結果は目安としてご利用ください。
${RELATED_NAV}
</footer>
</main>
${extraScript}
</body>
</html>`;
}

function writePage(relPath, html) {
  const file = path.join(OUT, relPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

const guideLinks = depth => `<h2>あわせて読む</h2><div class="links">
<a href="${rel(depth, "")}">睡眠サイクル計算ツール</a>
<a href="${rel(depth, "guide/cycle/")}">睡眠サイクルとは？</a>
<a href="${rel(depth, "guide/kaimin/")}">快眠のための工夫</a></div>`;

// lib/sleepcalc.js の <client> ブロックをそのままページに埋め込み、クライアント側でも同じロジックを使う
const clientLib = fs.readFileSync(path.join(__dirname, "lib", "sleepcalc.js"), "utf8")
  .split("// <client>")[1].split("// </client>")[0];

// ---- トップページ（計算ツール） ----
function renderRow(r) {
  const dayNote = r.dayOffset < 0 ? "（前日）" : r.dayOffset > 0 ? "（翌日）" : "";
  return `<li><span class="time">${r.label}<small>${dayNote}</small></span><span class="sub">${r.hours}（サイクル${r.cycles}回）</span></li>`;
}

function guideTable() {
  const wakes = [[6, 0], [6, 30], [7, 0], [7, 30]];
  const rows = wakes.map(([h, m]) => {
    const wakeLabel = `${h}:${String(m).padStart(2, "0")}`;
    const beds = computeBedtimes(h, m).slice().reverse(); // ヘッダの4.5h→9h昇順に合わせる（computeBedtimesは9h→4.5hの降順で返す）
    return `<tr><td>${wakeLabel}</td>${beds.map(b => `<td>${b.label}${b.dayOffset < 0 ? "<small>（前日）</small>" : ""}</td>`).join("")}</tr>`;
  }).join("\n");
  return `<div class="tbl"><table>
<thead><tr><th>起床時刻</th><th>4.5時間睡眠</th><th>6時間睡眠</th><th>7.5時間睡眠</th><th>9時間睡眠</th></tr></thead>
<tbody>${rows}</tbody></table></div>`;
}

function buildHome() {
  const body = `
<section class="tool">
<h2>モード1: 起きたい時刻から、寝る時刻を計算</h2>
<div class="toolrow">
<label>起きたい時刻 <input type="time" id="wakeInput" value="07:00"></label>
<button type="button" id="wakeBtn">寝る時刻を計算</button>
</div>
<ul class="result" id="wakeResult"></ul>

<h2>モード2: 今すぐ寝るなら、起きる時刻を計算</h2>
<div class="toolrow">
<button type="button" id="nowBtn">今の時刻で計算する</button>
</div>
<ul class="result" id="nowResult"></ul>

<p class="note">睡眠は約90分のサイクル（レム睡眠とノンレム睡眠の組み合わせ）を繰り返すとされていますが、これはあくまで平均的な目安です。実際のサイクルの長さには70〜110分程度の個人差があり、同じ人でもその日の疲労度などで変動します。サイクルの節目ちょうどに起きられるとは限らないので、あくまで参考としてご利用ください。</p>
</section>

<h2>使い方</h2>
<p>「起床時刻から逆算」は、起きたい時刻を入力すると、90分サイクルを3〜6回（4.5〜9時間）と、寝つくまでの目安時間（約15分）を差し引いた就寝時刻の候補を表示します。「今すぐ寝る」は、現在時刻から同様に起床時刻の候補を計算します。</p>

<h2>起床時刻別の就寝時刻の目安</h2>
<p>よくある起床時刻（6:00・6:30・7:00・7:30）について、睡眠時間ごとの就寝時刻の目安をまとめました。</p>
${guideTable()}

${guideLinks(0)}`;

  const bindScript = `<script>
${clientLib}
(function(){
  function render(ul, rows){
    ul.innerHTML = rows.map(function(r){
      var dayNote = r.dayOffset < 0 ? "（前日）" : r.dayOffset > 0 ? "（翌日）" : "";
      return '<li><span class="time">' + r.label + '<small>' + dayNote + '</small></span><span class="sub">' + r.hours + '（サイクル' + r.cycles + '回）</span></li>';
    }).join("");
  }
  var wakeInput = document.getElementById("wakeInput");
  var wakeResult = document.getElementById("wakeResult");
  document.getElementById("wakeBtn").addEventListener("click", function(){
    var v = wakeInput.value;
    if(!v) return;
    var parts = v.split(":");
    render(wakeResult, computeBedtimes(parseInt(parts[0],10), parseInt(parts[1],10)));
  });
  var nowResult = document.getElementById("nowResult");
  document.getElementById("nowBtn").addEventListener("click", function(){
    var n = new Date(Date.now() + 540*60000);
    render(nowResult, computeWaketimes(n.getUTCHours(), n.getUTCMinutes()));
  });
})();
</script>`;

  const websiteJson = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org", "@type": "WebSite",
    name: SITE_NAME, url: BASE,
  })}</script>`;

  writePage("index.html", shell({
    path: "", depth: 0,
    title: `${SITE_NAME}｜起床・就寝時刻をサイクルから逆算`,
    desc: "起きたい時刻、または今すぐ寝る場合の時刻を入力するだけで、90分の睡眠サイクル×3〜6回に基づいた就寝・起床時刻の候補を計算します。90分サイクルは平均的な目安で個人差がある点も解説。",
    h1: SITE_NAME,
    breadcrumbs: [],
    body,
    extraHead: websiteJson,
    extraScript: bindScript,
  }));
}

// ---- 睡眠サイクルとは ----
function buildGuideCycle() {
  const body = `
<section class="feature"><p>睡眠は、深い眠りの<strong>ノンレム睡眠</strong>と、体は休みつつ脳が活発に動く<strong>レム睡眠</strong>が交互に繰り返されて構成されています。この1セットが平均して約90分とされ、一晩に4〜6回ほど繰り返されます。</p></section>

<h2>ノンレム睡眠とレム睡眠</h2>
<p>入眠直後はまずノンレム睡眠から始まり、眠りの深さが徐々に浅くなりながら60〜80分ほど続いた後、レム睡眠が10〜30分ほど訪れて1サイクルが終わります。レム睡眠のタイミングは比較的目が覚めやすいとされ、「サイクルの節目で起きるとすっきりする」という考え方の根拠になっています。</p>

<h2>90分はあくまで平均値</h2>
<p>「睡眠サイクル=90分」という数字は広く知られていますが、これは平均的な値であり、実際には人によって<strong>70分〜110分程度</strong>の幅があるとされています。同じ人でも、その日の疲労度や体調、年齢によってサイクルの長さは変動します。また最初のサイクルは短く、後半のサイクルほど長くなる傾向があるともいわれます。</p>
<p>そのため「90分の倍数で起きれば必ずすっきり目覚められる」というわけではなく、あくまで就寝・起床時刻を検討するための目安の一つとして捉えるのがよいとされています。</p>

<h2>サイクルの区切りを意識する意味</h2>
<p>睡眠時間そのもの（一般的に成人で7〜9時間程度が目安とされます）を確保することがまず重要で、その上でサイクルの区切りに近いタイミングで起床時刻を設定すると、深い眠りの最中に起こされる可能性を減らせる、という考え方です。本ツールの計算結果も、この目安に基づいた参考値としてご利用ください。</p>

<section class="note"><p>日中の強い眠気が続く、いびきや呼吸の乱れを指摘される、眠っても疲れが取れないといった症状が続く場合は、睡眠障害が疑われることがあります。自己判断せず、医療機関へご相談ください。</p></section>

${guideLinks(2)}`;

  writePage("guide/cycle/index.html", shell({
    path: "guide/cycle/", depth: 2,
    title: "睡眠サイクルとは？90分の仕組みと個人差を解説",
    desc: "睡眠サイクルを構成するノンレム睡眠とレム睡眠の仕組み、「90分」があくまで平均値で実際は70〜110分程度の個人差がある点、サイクルの区切りを意識する意味について解説します。",
    h1: "睡眠サイクルとは？90分の仕組みと個人差",
    breadcrumbs: [{ name: SITE_NAME, path: "" }, { name: "睡眠サイクルとは？", path: "guide/cycle/" }],
    body,
  }));
}

// ---- 快眠のための工夫 ----
function buildGuideKaimin() {
  const goodsList = KAIMIN_GOODS.map(g =>
    `<li><a href="${esc(g.url)}" rel="sponsored noopener" target="_blank">${esc(g.label)}</a> — ${esc(g.note)}</li>`
  ).join("\n");

  const body = `
<section class="feature"><p>睡眠サイクルの計算に加えて、寝つきや眠りの質に影響するとされる一般的な生活習慣・環境づくりのポイントをまとめました。効果には個人差があります。</p></section>

<h2>就寝前の過ごし方</h2>
<ul style="margin-left:1.2em">
<li><strong>スマートフォン・PCの画面</strong> — 就寝直前まで画面を見続けると、光の刺激で寝つきに影響するといわれています。就寝30分〜1時間前には手放す、画面の明るさを落とすといった工夫が挙げられます。</li>
<li><strong>カフェイン</strong> — コーヒー・緑茶・エナジードリンクなどに含まれるカフェインは、摂取から数時間覚醒作用が続くとされます。夕方以降は控えめにするのが一般的な目安です。</li>
<li><strong>入浴</strong> — 就寝の1〜2時間前に湯船で体を温めておくと、その後の体温低下とともに眠気が訪れやすいといわれています。</li>
</ul>

<h2>寝室・寝具の環境</h2>
<ul style="margin-left:1.2em">
<li><strong>光</strong> — 真っ暗にする、あるいはアイマスクを使うなど、光を遮ることで寝つきやすくなるといわれています。</li>
<li><strong>温度・湿度</strong> — 季節に合わせて寝室の温度・湿度を整えることも、睡眠の質に関わるとされる基本的なポイントです。</li>
<li><strong>枕・マットレス</strong> — 自分の体格や寝姿勢に合わない寝具は、肩こり・腰痛や寝返りの多さにつながることがあるといわれます。定期的な見直しが勧められています。</li>
</ul>

<section class="note goods"><h2>快眠グッズ<small>（広告を含みます）</small></h2><ul>${goodsList}</ul></section>

<section class="note"><p>上記は一般的に言われている生活習慣上の工夫であり、医学的な効果を保証するものではありません。不眠や強い眠気が続く場合は、医療機関へご相談ください。</p></section>

${guideLinks(2)}`;

  writePage("guide/kaimin/index.html", shell({
    path: "guide/kaimin/", depth: 2,
    title: "快眠のための工夫｜就寝前の習慣と寝室環境の見直し",
    desc: "就寝前のスマートフォン・カフェインとの付き合い方、入浴のタイミング、寝室の光・温度・寝具といった、快眠のために一般的にいわれている工夫をまとめました。",
    h1: "快眠のための工夫",
    breadcrumbs: [{ name: SITE_NAME, path: "" }, { name: "快眠のための工夫", path: "guide/kaimin/" }],
    body,
  }));
}

function build404() {
  writePage("404.html", `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>ページが見つかりません</title><style>${CSS}</style></head>
<body><main style="text-align:center;padding-top:3rem"><h1>ページが見つかりません</h1><p><a href="${BASE}">${esc(SITE_NAME)} トップへ</a></p></main></body></html>`);
}
function buildSitemap() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${emittedUrls.map(u => `  <url><loc>${u}</loc><lastmod>${TODAY_STR}</lastmod></url>`).join("\n")}
</urlset>
`;
  fs.writeFileSync(path.join(OUT, "sitemap.xml"), xml);
  // IndexNow キーファイル（公開前提のキー。keyLocation はサイトのサブパス配下である必要がある）
  fs.writeFileSync(path.join(OUT, "f4d36824ae452bf2bac90928b2b506e8.txt"), "f4d36824ae452bf2bac90928b2b506e8");
}

// ---- 実行 ----
fs.rmSync(OUT, { recursive: true, force: true });
buildHome();
buildGuideCycle();
buildGuideKaimin();
build404();
buildSitemap();
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");

for (const t of linkTargets) {
  const f = path.join(OUT, t, "index.html");
  if (!fs.existsSync(f)) throw new Error(`BROKEN LINK TARGET: ${t}`);
}
const expected = 3; // home + guide/cycle + guide/kaimin
if (emittedUrls.length !== expected) throw new Error(`page count ${emittedUrls.length} != ${expected}`);
if (!emittedUrls.every(u => u.startsWith(BASE))) throw new Error("URL outside BASE");
console.log(`OK: ${emittedUrls.length} pages + 404 + sitemap generated for ${TODAY_STR}`);
