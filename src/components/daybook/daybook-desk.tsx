"use client";

import { useState } from "react";
import { formatJst } from "@/lib/runtime/rules/datetime";
import { sampleRequests, STUDIO } from "@/lib/daybook/seed";
import {
  DAYBOOK_STORAGE_DISCLOSURE,
  DAYBOOK_STORAGE_KEY,
  type RequestRecord,
} from "@/lib/daybook/store";
import { SandboxData } from "@/components/sandbox-data";
import { useDaybook } from "./daybook-provider";
import { SlotPicker } from "./slot-picker";
import { RequestTimeline } from "./request-timeline";

/**
 * The requester's side (指示書 §14).
 *
 * The flow the spec calls mandatory runs top to bottom on this page: the time
 * you asked for is taken → here are times that are actually free → you take
 * one → it is held, not booked → you agree → the studio approves → later you
 * ask to move it, and until that move is approved you still have the original
 * appointment.
 *
 * Nothing here decides anything on its own. Every refusal names the rule it
 * came from, because "この時間は選べません" without a reason is the message
 * this whole demo exists to replace.
 */

const hourLabel = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

function statusOf(record: RequestRecord, status: string | null) {
  if (status === "CANCELLED") return { label: "取消済み", tone: "off" };
  if (record.moveToIso) return { label: "変更の承認待ち", tone: "wait" };
  if (status === "CONFIRMED") return { label: "確定", tone: "done" };
  if (record.requesterAgreedAt)
    return { label: "お店の承認待ち", tone: "wait" };
  if (status === "HELD") return { label: "仮押さえ中", tone: "hold" };
  return { label: "候補を選ぶ段階", tone: "open" };
}

export function DaybookDesk() {
  const daybook = useDaybook();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [moving, setMoving] = useState("");

  if (!daybook.ready)
    return (
      <div className="daybook-panel daybook-placeholder" aria-busy="true">
        <p>予約の状況を読み込んでいます。</p>
      </div>
    );

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    daybook.submit({
      name: name.trim() || "お名前未記入",
      email: email.trim() || "sample@example.com",
      text: trimmed,
    });
    setText("");
  };

  return (
    <div className="daybook-desk">
      {daybook.notice ? (
        <p className="daybook-notice" role="status">
          {daybook.notice}{" "}
          <button
            type="button"
            className="daybook-link"
            onClick={daybook.dismissNotice}
          >
            閉じる
          </button>
        </p>
      ) : null}

      <section className="daybook-panel" aria-labelledby="daybook-ask">
        <h2 id="daybook-ask">1. 希望を文章で送る</h2>
        <p className="daybook-lede">
          {
            "決まった入力欄に合わせて書き直す必要はありません。ふつうの問い合わせ文から日付と時刻を読み取り、読み取れなかったものは読み取れなかったと表示します。"
          }
        </p>
        <div className="daybook-samples">
          <p className="daybook-label">例文を入れる</p>
          <div className="daybook-sample-row">
            {sampleRequests.map((sample) => (
              <button
                key={sample.id}
                type="button"
                className="daybook-chip"
                onClick={() => {
                  setText(sample.text(new Date().toISOString()));
                  setName(sample.name);
                  setEmail(sample.email);
                }}
              >
                <strong>{sample.label}</strong>
                <span>{sample.note}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="daybook-field">
          <label htmlFor="daybook-text">ご依頼の内容</label>
          <textarea
            id="daybook-text"
            rows={4}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="例）来週の火曜14時から1時間、撮影をお願いできますか。"
          />
        </div>
        <div className="daybook-field-row">
          <div className="daybook-field">
            <label htmlFor="daybook-name">お名前</label>
            <input
              id="daybook-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="daybook-field">
            <label htmlFor="daybook-email">連絡先（架空で構いません）</label>
            <input
              id="daybook-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </div>
        </div>
        <button
          type="button"
          className="daybook-button"
          onClick={send}
          disabled={!text.trim()}
        >
          {text.trim() ? "この内容で相談する" : "内容を入力してください"}
        </button>
        <p className="daybook-fineprint">
          {`営業日は月〜金、${hourLabel(STUDIO.openMinute)}〜${hourLabel(STUDIO.closeMinute)}。1件 ${STUDIO.serviceMinutes} 分、前後に ${STUDIO.bufferBeforeMinutes} 分の準備と片付けを取ります。この前後の時間も予定として埋まるので、見た目に隣り合う枠が取れないことがあります。`}
        </p>
      </section>

      <section className="daybook-panel" aria-labelledby="daybook-requests">
        <h2 id="daybook-requests">2. 受け付けた相談</h2>
        {daybook.state.requests.length === 0 ? (
          <p className="daybook-empty">
            {
              "まだ相談はありません。上の例文を入れて送ると、空き状況の確認から確定までを一通り試せます。"
            }
          </p>
        ) : (
          <ul className="daybook-records">
            {daybook.state.requests.map((record) => {
              const booking = daybook.bookingOf(record);
              const state = statusOf(record, booking?.status ?? null);
              const confirmed = booking?.status === "CONFIRMED";
              const cancelled = booking?.status === "CANCELLED";
              return (
                <li key={record.requestId} className="daybook-record">
                  <div className="daybook-record-head">
                    <div>
                      <p className="daybook-record-id">{record.requestId}</p>
                      <p className="daybook-record-when">
                        {booking && !cancelled
                          ? formatJst(booking.startIso)
                          : record.requestedIso
                            ? `希望：${formatJst(record.requestedIso)}`
                            : "日時は未定"}
                      </p>
                    </div>
                    <span className={`daybook-badge is-${state.tone}`}>
                      {state.label}
                    </span>
                  </div>

                  <p className="daybook-record-text">{record.text}</p>

                  {record.moveToIso ? (
                    <div className="daybook-diff">
                      <p className="daybook-label">変更の希望を出しています</p>
                      <p>
                        <s>{formatJst(booking?.startIso ?? "")}</s>{" "}
                        <span aria-hidden="true">→</span>{" "}
                        <strong>{formatJst(record.moveToIso)}</strong>
                      </p>
                      <p className="daybook-fineprint">
                        {
                          "承認されるまで元の予約はそのまま残ります。承認された時点で元の枠が解放されます。"
                        }
                      </p>
                    </div>
                  ) : null}

                  {!booking && !cancelled ? (
                    <div className="daybook-step">
                      <p className="daybook-label">空いている候補</p>
                      <SlotPicker
                        slots={record.proposals}
                        action="この日時を仮押さえする"
                        emptyNote="この条件では14日先まで空きがありませんでした。日付を変えてもう一度ご相談ください。"
                        onChoose={(startIso) =>
                          daybook.hold(record.requestId, startIso)
                        }
                      />
                    </div>
                  ) : null}

                  {booking?.status === "HELD" && !record.requesterAgreedAt ? (
                    <div className="daybook-step">
                      <p className="daybook-label">
                        {booking.holdExpiresAt
                          ? `${formatJst(booking.holdExpiresAt)} まで取り置き中`
                          : "取り置き中"}
                      </p>
                      <p>
                        {
                          "まだ予約は成立していません。この日時で進めてよければ、下のボタンで合意を記録します。確定にはお店の承認も必要です。"
                        }
                      </p>
                      <button
                        type="button"
                        className="daybook-button"
                        onClick={() => daybook.agree(record.requestId)}
                      >
                        この日時で確定を依頼する
                      </button>
                    </div>
                  ) : null}

                  {record.requesterAgreedAt && !confirmed && !cancelled ? (
                    <p className="daybook-wait">
                      {
                        "合意は記録しました。お店が承認すると確定します。（この体験では「運用側の画面」から承認できます）"
                      }
                    </p>
                  ) : null}

                  {confirmed && !record.moveToIso ? (
                    <div className="daybook-step">
                      {moving === record.requestId ? (
                        <>
                          <p className="daybook-label">変更先の候補</p>
                          <SlotPicker
                            slots={daybook.alternatives(
                              new Date().toISOString(),
                              booking?.bookingId,
                            )}
                            action="この日時への変更を依頼する"
                            emptyNote="14日先まで空きがありませんでした。"
                            onChoose={(startIso) => {
                              daybook.askToMove(record.requestId, startIso);
                              setMoving("");
                            }}
                          />
                          <button
                            type="button"
                            className="daybook-link"
                            onClick={() => setMoving("")}
                          >
                            変更をやめる
                          </button>
                        </>
                      ) : (
                        <div className="daybook-actions">
                          <button
                            type="button"
                            className="daybook-button is-quiet"
                            onClick={() => setMoving(record.requestId)}
                          >
                            日時を変更したい
                          </button>
                          <button
                            type="button"
                            className="daybook-link"
                            onClick={() => daybook.cancel(record.requestId)}
                          >
                            予約を取り消す
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}

                  <RequestTimeline record={record} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <SandboxData
        name="daybook"
        storageKey={DAYBOOK_STORAGE_KEY}
        label="相談と予約"
        theme="daybook"
        buttonClass="daybook-button is-quiet"
        disclosure={DAYBOOK_STORAGE_DISCLOSURE}
        onExport={daybook.exportData}
        onImport={daybook.importData}
        onReset={daybook.reset}
      />
    </div>
  );
}
