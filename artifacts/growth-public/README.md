# artifacts/growth-public

検証済みで、公開しても差し支えない原稿と素材だけを置く。
**ここにあるものは、まだどこにも公開・送信していない。**

- `listings/` 媒体別の出品・提案原稿（媒体ごとの規約に合わせた別原稿）
- `content/` 投稿原稿と、実画面から作る素材の指示
- `templates/` 完成品（販売候補）の下書き

検査: `npm run growth:lint`（`docs/growth/CHANNEL_POLICY.md` のルールを適用）。
各ファイルの先頭に `growth-draft` メタデータが必要:

```text
<!-- growth-draft
channel: coconala | lancers | crowdworks | partner | x | internal
status: template | ready_for_owner
url_approved: true   ← CrowdWorks で自社URLを載せる承認が出た場合のみ
-->
```

営業先・連絡先・見積などの非公開情報は**ここに置かない**（repo は public）。
それらはローカル領域（既定 `~/.tsudowa-growth/`）で扱う。
