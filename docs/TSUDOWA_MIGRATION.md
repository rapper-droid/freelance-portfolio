# TSUDOWA parent-brand migration

## 基準点

```text
移行元branch  tanebi/works-integration-review
移行前HEAD    56f2beba6ee569ffdc663cac679ae019d7147b10
正式domain    https://tsudowa.com
deploy        未実施
```

`CLAUDE_SESSION_HANDOVER.md`は移行元HEADに存在しませんでした。
`ART_DIRECTION.md`、`IMAGE_SOURCES.md`、`CONTACT_EMAIL.md`、repository realityを正本として扱います。

## TANEBI監査分類

### A. 公開ブランドとして変更

- metadata / title / OGP / manifest / favicon
- header / footer / TOP / alt・aria文脈
- 問い合わせ件名・送信者表示
- public brand/social assets
- current art direction・effect資料

### B. 履歴として保持

- `docs/TANEBI_REMAKE.md`
- `docs/INTEGRATION_REVIEW.md`
- `docs/FINAL_ART_DIRECTION.md` / `FINAL_ART_IMPLEMENTATION.md` / `FINAL_ART_QA.md`
- `docs/RELEASE_QA.md`（移行前の実測記録）
- `docs/screenshots/tanebi-remake/`
- `assets/brand/tanebi-master-icon.jpeg`
- `src/lib/brand.ts`の旧title suffix（既存metadata補正のみ）

### C. 変更すると危険なため維持

- category id、project slug、URL
- price、duration、materials
- Redisの`portfolio:submission` namespace（移行中retryの連続性）
- analytics event名と外部連携契約

### D. 削除

- public配下の旧TANEBI mark/social PNG
- 公開コード内の旧ブランド専用comment/file/keyframe名

## production境界

コードと資産はtsudowa.com公開準備まで行います。production merge、deploy、DNS、
Cloudflare zone、Email Routing、Resend設定はOWNER review前に変更しません。
