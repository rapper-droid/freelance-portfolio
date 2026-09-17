import { expect, it } from "vitest";
import fs from "node:fs/promises";
import { validateContact } from "@/lib/contact";
import { internalMail, receiptMail } from "@/lib/contact-mail";

it("renders a bounded visitor summary and an actionable owner ticket from the same receipt", async () => {
  const value = validateContact({
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    token: "test-only-token",
    consent: true,
    website: "",
    name: "サンプル 太郎",
    email: "visitor@example.test",
    company: "架空の制作事業",
    detail:
      "会社の紹介サイトを作りたいので相談です。内容の整理からお願いできますか。",
    kind: "Webサイト / LP",
    stage: "アイデア段階",
    budget: "5〜10万円",
    timing: "1か月以内",
    reference: "https://example.test/reference",
    supplement: "まずはメールでご相談したいです。",
    page: "/works/web",
    category: "web",
    project: "",
    demo: "",
  });
  expect(value).toBeTruthy();
  const receipt = {
    receipt: "TSW-260917-ABCDEF0123",
    receivedAt: "2026-09-17T00:00:00.000Z",
  };
  const owner = internalMail(value!, receipt);
  const visitor = receiptMail(value!, receipt);
  expect(owner.subject).toContain("[TSUDOWA][WEB][5〜10万円]");
  expect(owner.text).toContain(value!.detail);
  expect(owner.text).toContain("送信元ページ: /works/web");
  expect(visitor.html).toContain(receipt.receipt);
  expect(visitor.text).not.toContain(value!.detail);
  expect(visitor.html).not.toContain(value!.reference);
  expect(visitor.subject).toBe("お問い合わせを受け付けました｜TSUDOWA");
  if (process.env.MASTER_CONTACT_EVIDENCE === "true") {
    const out = "../../outputs/master-pass/email";
    await fs.mkdir(out, { recursive: true });
    await fs.writeFile(out + "/owner-notification.txt", owner.text);
    await fs.writeFile(out + "/visitor-receipt.txt", visitor.text);
    await fs.writeFile(out + "/visitor-receipt.html", visitor.html);
    await fs.writeFile(
      out + "/envelopes.json",
      JSON.stringify(
        {
          note: "Synthetic fixture only. Not sent. Envelope assertions are also in contact.test.ts.",
          owner: {
            from: "TSUDOWA <no-reply@tsudowa.com>",
            to: "contact@tsudowa.com",
            reply_to: value!.email,
            subject: owner.subject,
          },
          visitor: {
            from: "TSUDOWA <no-reply@tsudowa.com>",
            to: value!.email,
            reply_to: "contact@tsudowa.com",
            subject: visitor.subject,
          },
          receipt,
        },
        null,
        2,
      ),
    );
  }
});
