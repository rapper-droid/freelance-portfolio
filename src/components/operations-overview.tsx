import { CircleCheck, Activity, ArrowUpRight } from "lucide-react";

export function OperationsOverview({
  name,
  description,
  total,
  completed,
  pending,
}: {
  name: string;
  description: string;
  total: number;
  completed: number;
  pending: number;
}) {
  return (
    <section className="operations-overview" aria-label={`${name}の対応状況`}>
      <div>
        <span className="operation-kicker">
          <Activity size={15} /> WORKSPACE OVERVIEW
        </span>
        <h3>{name}</h3>
        <p>{description}</p>
      </div>
      <div className="operations-meter">
        <div>
          <span>完了した対応</span>
          <b>
            {completed}
            <small> / {total}</small>
          </b>
        </div>
        <meter
          min={0}
          max={Math.max(total, 1)}
          value={completed}
          aria-label="完了した対応の割合"
        />
        <p>
          <CircleCheck size={14} />
          完了 {completed}件 <span>未対応 {pending}件</span>
        </p>
      </div>
    </section>
  );
}

export function RevenueOverview({
  customers,
}: {
  customers: { id: string; name: string; revenue: number; status: string }[];
}) {
  const top = [...customers].sort((a, b) => b.revenue - a.revenue).slice(0, 4);
  const max = Math.max(...top.map((c) => c.revenue), 1);
  const total = customers.reduce((sum, c) => sum + c.revenue, 0);
  return (
    <section className="revenue-overview" aria-label="顧客データの概況">
      <div className="revenue-main">
        <span className="operation-kicker">
          CUSTOMER INTELLIGENCE / SAMPLE DATA
        </span>
        <h3>取引の全体像を、ひと目で。</h3>
        <p>顧客の追加・更新に合わせて、この概況も変わります。</p>
        <b>
          ¥{total.toLocaleString("ja-JP")}
          <ArrowUpRight size={24} />
        </b>
        <small>登録顧客の累計売上合計・架空データ</small>
      </div>
      <div className="revenue-bars">
        <h4>
          顧客別売上 <span>上位4社</span>
        </h4>
        {top.map((c) => (
          <div key={c.id}>
            <span>
              {c.name}
              <b>¥{c.revenue.toLocaleString("ja-JP")}</b>
            </span>
            <meter
              min={0}
              max={max}
              value={c.revenue}
              aria-label={`${c.name}の売上`}
            />
          </div>
        ))}
        {!top.length && <p>顧客を登録すると、ここに概況が表示されます。</p>}
      </div>
    </section>
  );
}
