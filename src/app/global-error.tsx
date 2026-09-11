"use client";
import ErrorPage from "./error";
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="ja">
      <body>
        <ErrorPage reset={reset} />
      </body>
    </html>
  );
}
