"use client";

import { useMemo, useState } from "react";
import {
  estimateSavings,
  formatMinutes,
  SAVINGS_DEFAULTS,
  type SavingsInput,
} from "@/lib/runtime/savings";

/**
 * 「自分の場合」の試算 (指示書 §11 step 5, §19).
 *
 * It looks like a calculator because it is one: the visitor's own figures,
 * one formula, shown alongside the assumptions. It is kept visibly separate
 * from anything measured — the heading says 試算, the deductions are listed
 * rather than folded in, and setup time sits outside the monthly number.
 *
 * Nothing is sent anywhere. The arithmetic runs in the browser and no figure
 * leaves it.
 */

const FIELDS: Array<{
  key: keyof Omit<SavingsInput, "hourlyRateYen">;
  label: string;
  suffix: string;
  step?: number;
  max?: number;
}> = [
  { key: "volume", label: "月の件数", suffix: "件", max: 100000 },
  {
    key: "currentMinutes",
    label: "従来の人手時間（1件）",
    suffix: "分",
    max: 480,
  },
  {
    key: "reviewMinutes",
    label: "導入後の確認時間（1件）",
    suffix: "分",
    max: 480,
  },
  {
    key: "exceptionMinutes",
    label: "例外1件あたりの対応時間",
    suffix: "分",
    max: 480,
  },
  {
    key: "operationMinutes",
    label: "月次の運用時間",
    suffix: "分",
    max: 10000,
  },
  {
    key: "setupMinutes",
    label: "初期設定（1回だけ）",
    suffix: "分",
    max: 10000,
  },
];

export function SavingsCalculator() {
  const [input, setInput] = useState<SavingsInput>(SAVINGS_DEFAULTS);
  const [rate, setRate] = useState("");

  const result = useMemo(
    () =>
      estimateSavings({
        ...input,
        hourlyRateYen: rate ? Number(rate) : undefined,
      }),
    [input, rate],
  );

  const set = (key: keyof SavingsInput, value: string) =>
    setInput((prev) => ({ ...prev, [key]: Number(value) }));

  return (
    <div className="savings">
      <div className="savings-inputs">
        {FIELDS.map((f) => (
          <label key={f.key} className="savings-field">
            <span>{f.label}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={f.max}
              step={f.step ?? 1}
              value={input[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
            />
            <small>{f.suffix}</small>
          </label>
        ))}
        <label className="savings-field">
          <span>例外の割合</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            value={Math.round(input.exceptionRate * 100)}
            onChange={(e) =>
              setInput((prev) => ({
                ...prev,
                exceptionRate: Number(e.target.value) / 100,
              }))
            }
          />
          <small>%</small>
        </label>
        <label className="savings-field">
          <span>時間単価（任意）</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={1000000}
            value={rate}
            placeholder="未入力"
            onChange={(e) => setRate(e.target.value)}
          />
          <small>円</small>
        </label>
      </div>

      <div className="savings-output" role="status" aria-live="polite">
        <p className="savings-kicker">試算（実績ではありません）</p>
        <p className="savings-figure">
          月の純削減時間{" "}
          <strong>{formatMinutes(result.netSavedMinutes)}</strong>
        </p>
        <dl className="savings-breakdown">
          <div>
            <dt>単純な短縮</dt>
            <dd>{formatMinutes(result.grossSavedMinutes)}</dd>
          </div>
          <div>
            <dt>− 例外対応</dt>
            <dd>{formatMinutes(result.exceptionCostMinutes)}</dd>
          </div>
          <div>
            <dt>− 月次運用</dt>
            <dd>{formatMinutes(result.operationMinutes)}</dd>
          </div>
          <div>
            <dt>初期設定（別枠）</dt>
            <dd>{formatMinutes(result.setupMinutes)}</dd>
          </div>
        </dl>

        {result.monthlyValueYen !== null && (
          <p className="savings-note">
            入力された時間単価での参考換算：月{" "}
            {result.monthlyValueYen.toLocaleString("ja-JP")} 円。
            人件費の現金支出が必ず減ること、一定期間で元が取れることを保証するものではありません。
          </p>
        )}
        {result.setupPaybackMonths !== null && (
          <p className="savings-note">
            初期設定の時間は、この条件なら約 {result.setupPaybackMonths}{" "}
            か月分の 削減時間に相当します。
          </p>
        )}
        {result.caveats.map((c) => (
          <p key={c} className="savings-caveat">
            {c}
          </p>
        ))}

        <details className="savings-assumptions">
          <summary>この計算の前提</summary>
          <p>
            月の純削減時間 = 件数 ×（従来の人手時間 − 導入後の確認時間） −
            例外対応時間 − 月次運用時間
          </p>
          <ul>
            {result.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <p>
            {
              "入力した条件による計算です。体験で計測した値ではありません。実際の効果は対象業務・例外の多さ・運用体制によって変わります。入力値はこのブラウザ内だけで計算し、送信していません。"
            }
          </p>
        </details>
      </div>
    </div>
  );
}
