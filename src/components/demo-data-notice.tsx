export function DemoDataNotice({
  text = "架空データを使用しています。入力はこのブラウザ内だけで処理され、外部送信されません。",
}: {
  text?: string;
}) {
  return (
    <details className="demo-data-disclosure">
      <summary>
        DEMO DATA <span>架空のサンプル</span>
      </summary>
      <p>{text}</p>
    </details>
  );
}
