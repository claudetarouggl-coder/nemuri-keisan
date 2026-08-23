"use strict";
// 睡眠サイクル計算ロジック（ブラウザ・Node両方から使う純粋関数のみ）
// 90分は平均的な目安で、実際には個人差が大きい（一般に70〜110分程度とされる）。
// <client>
var CYCLE_MIN = 90;
var ONSET_MIN = 15; // 寝床に入ってから寝つくまでの目安時間
var CYCLE_COUNTS = [6, 5, 4, 3]; // 9h/7.5h/6h/4.5h 相当（長い順）

function hoursLabel(cycles) {
  var h = (cycles * CYCLE_MIN) / 60;
  return (h % 1 === 0 ? String(h) : h.toFixed(1)) + "時間";
}

function fmtClock(h, m) {
  return h + ":" + (m < 10 ? "0" + m : String(m));
}

// baseMin(0-1439)にdeltaMin(正負可)を加算し、日をまたいだかどうかも返す
function shiftClock(baseMin, deltaMin) {
  var total = baseMin + deltaMin;
  var dayOffset = Math.floor(total / 1440);
  var mod = ((total % 1440) + 1440) % 1440;
  return { h: Math.floor(mod / 60), m: mod % 60, dayOffset: dayOffset };
}

// 起床時刻から、就寝候補を逆算する（起床 − サイクル×90分 − 入眠15分）
function computeBedtimes(wakeH, wakeM) {
  var wakeMin = wakeH * 60 + wakeM;
  return CYCLE_COUNTS.map(function (cycles) {
    var t = shiftClock(wakeMin, -(cycles * CYCLE_MIN + ONSET_MIN));
    return { cycles: cycles, hours: hoursLabel(cycles), h: t.h, m: t.m, dayOffset: t.dayOffset, label: fmtClock(t.h, t.m) };
  });
}

// 基準時刻（今すぐ寝る場合の現在時刻）から、起床候補を算出する（基準 + 入眠15分 + サイクル×90分）
function computeWaketimes(nowH, nowM) {
  var nowMin = nowH * 60 + nowM;
  return CYCLE_COUNTS.slice().reverse().map(function (cycles) {
    var t = shiftClock(nowMin, cycles * CYCLE_MIN + ONSET_MIN);
    return { cycles: cycles, hours: hoursLabel(cycles), h: t.h, m: t.m, dayOffset: t.dayOffset, label: fmtClock(t.h, t.m) };
  });
}
// </client>

module.exports = { computeBedtimes, computeWaketimes, CYCLE_MIN, ONSET_MIN, CYCLE_COUNTS };

// 自己検証
if (require.main === module) {
  var assert = require("assert");

  // 起床7:00 → 就寝候補は 21:45 / 23:15 / 0:45 / 2:15（日またぎを含む）
  var b1 = computeBedtimes(7, 0);
  assert.strictEqual(b1[0].label, "21:45"); assert.strictEqual(b1[0].dayOffset, -1); assert.strictEqual(b1[0].hours, "9時間");
  assert.strictEqual(b1[1].label, "23:15"); assert.strictEqual(b1[1].dayOffset, -1); assert.strictEqual(b1[1].hours, "7.5時間");
  assert.strictEqual(b1[2].label, "0:45");  assert.strictEqual(b1[2].dayOffset, 0);  assert.strictEqual(b1[2].hours, "6時間");
  assert.strictEqual(b1[3].label, "2:15");  assert.strictEqual(b1[3].dayOffset, 0);  assert.strictEqual(b1[3].hours, "4.5時間");

  // 起床0:30 → 引き算が前日の午後まで戻る日またぎケース
  var b2 = computeBedtimes(0, 30);
  assert.strictEqual(b2[0].label, "15:15"); assert.strictEqual(b2[0].dayOffset, -1);
  assert.strictEqual(b2[3].label, "19:45"); assert.strictEqual(b2[3].dayOffset, -1);

  // 23:00に今すぐ寝る → 起床候補は翌日にまたがる
  var w1 = computeWaketimes(23, 0);
  assert.strictEqual(w1[0].label, "3:45"); assert.strictEqual(w1[0].dayOffset, 1);  // 4.5h後
  assert.strictEqual(w1[3].label, "8:15"); assert.strictEqual(w1[3].dayOffset, 1);  // 9h後

  // 12:00に今すぐ寝る → 日またぎなしのケース
  var w2 = computeWaketimes(12, 0);
  assert.strictEqual(w2[0].label, "16:45"); assert.strictEqual(w2[0].dayOffset, 0);
  assert.strictEqual(w2[3].label, "21:15"); assert.strictEqual(w2[3].dayOffset, 0);

  console.log("sleepcalc.js self-check OK");
}
