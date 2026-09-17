import { headerSafe, type ContactValue } from "./contact";
import { contactKinds, kindCodes } from "./contact-options";
export type Receipt = { receipt: string; receivedAt: string };
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function internalMail(v: ContactValue, r: Receipt) {
  const text = [
    "NEW INQUIRY / TETSU WORKS",
    "",
    "種類: " + v.kind,
    "予算: " + v.budget,
    "希望時期: " + v.timing,
    "状況: " + v.stage,
    "お名前: " + v.name,
    "会社名・屋号: " + (v.company || "未記入"),
    "Email: " + v.email,
    "受付番号: " + r.receipt,
    "",
    "--- ご相談内容 ---",
    v.detail,
    "",
    "参考URL: " + (v.reference || "未記入"),
    "補足: " + (v.supplement || "未記入"),
    "",
    "--- 受付情報 ---",
    "送信元ページ: " + v.page,
    "カテゴリ: " + (v.category || "未指定"),
    "制作例: " + (v.project || "未指定"),
    "デモ: " + (v.demo || "未指定"),
    "受信日時: " + r.receivedAt,
    "内部request ID: " + v.id,
    "",
    "このメールに返信すると相談者へ届きます。参考URLは利用者の入力です。安全性を確認して開いてください。",
  ].join("\n");
  return {
    subject:
      "[TSUDOWA][" +
      kindCodes[contactKinds.indexOf(v.kind as (typeof contactKinds)[number])] +
      "][" +
      v.budget +
      "] " +
      headerSafe(v.name) +
      "様からのご相談",
    text,
  };
}
export function receiptMail(v: ContactValue, r: Receipt) {
  // Bounded summary, not reflection of arbitrary user links/messages into mail.
  const summary = v.kind + " / ご予算 " + v.budget + " / 希望時期 " + v.timing;
  const text = [
    v.name + " 様",
    "",
    "お問い合わせを受け付けました。",
    "受付番号: " + r.receipt,
    "",
    "TSUDOWA / TETSU WORKSへのご相談、ありがとうございます。",
    "ご相談の概要: " + summary,
    "受信日時: " + r.receivedAt,
    "",
    "内容を確認し、担当者からメールでご連絡します。ご希望の時期や制作の可否は、内容を確認してからご相談します。",
    "追加の情報がありましたら、このメールにそのまま返信できます。返信先は contact@tsudowa.com です。",
    "",
    "このメールにお心当たりがない場合は、対応は不要です。",
    "TSUDOWA / TETSU WORKS",
  ].join("\n");
  const html =
    '<!doctype html><html lang="ja" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>お問い合わせ受付｜TSUDOWA</title></head><body style="margin:0;background:#f5f3ef;color:#202a25"><div lang="ja" dir="ltr" style="max-width:600px;margin:auto;padding:36px 24px;font:16px/1.8 Arial,sans-serif"><p style="font-size:12px;letter-spacing:2px">TSUDOWA / TETSU WORKS</p><h1 style="font-size:25px;line-height:1.5">お問い合わせを<br>受け付けました。</h1><p>' +
    escape(v.name) +
    ' 様</p><p>ご相談ありがとうございます。担当者が内容を確認し、メールでご連絡します。</p><div style="padding:20px;background:#fff;border:1px solid #c9cec8"><p>受付番号<br><strong>' +
    escape(r.receipt) +
    "</strong></p><p>" +
    escape(summary) +
    '</p><p style="font-size:13px">受信日時: ' +
    escape(r.receivedAt) +
    '</p></div><h2 style="font-size:18px">次のご案内</h2><p>ご希望の時期や制作の可否は、内容を確認してからご相談します。追加の情報は、このメールへそのまま返信できます。</p><p><a href="mailto:contact@tsudowa.com" style="color:#21533d;text-decoration:underline">contact@tsudowa.com</a></p><p style="font-size:13px">このメールにお心当たりがない場合は、対応は不要です。</p></div></body></html>';
  return { subject: "お問い合わせを受け付けました｜TSUDOWA", text, html };
}
