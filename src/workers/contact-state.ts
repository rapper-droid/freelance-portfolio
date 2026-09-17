import { DurableObject } from "cloudflare:workers";
import { diagnosticsEnabled, OWNER_KEYS } from "./owner-diagnostics";

export type StateOperation =
  | { kind: "get" }
  | { kind: "set"; value: string; ttl: number; nx: boolean }
  | { kind: "increment"; ttl: number }
  | { kind: "unlock"; token: string };
type Row = { value: string; expires: number };

// One coordination atom per logical state key, not one global contact object.
// No form contents, email addresses, raw IPs or provider secrets are stored here.
export class ContactState extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL, expires INTEGER NOT NULL)",
    );
  }
  async execute(op: StateOperation): Promise<string | number | null> {
    if (!op || !["get", "set", "increment", "unlock"].includes(op.kind))
      throw Error("invalid_state_operation");
    if (
      "ttl" in op &&
      (!Number.isInteger(op.ttl) || op.ttl < 1 || op.ttl > 2678401)
    )
      throw Error("invalid_ttl");
    if (
      op.kind === "set" &&
      (typeof op.value !== "string" ||
        op.value.length > 16384 ||
        typeof op.nx !== "boolean")
    )
      throw Error("invalid_value");
    if (
      op.kind === "unlock" &&
      (typeof op.token !== "string" || op.token.length > 256)
    )
      throw Error("invalid_token");
    const now = Date.now();
    const result = this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec("DELETE FROM state WHERE expires <= ?", now);
      const row = this.ctx.storage.sql
        .exec<Row>("SELECT value, expires FROM state WHERE id=1")
        .toArray()[0];
      if (op.kind === "get") return row?.value ?? null;
      if (op.kind === "unlock") {
        if (!row || row.value !== op.token) return 0;
        this.ctx.storage.sql.exec(
          "DELETE FROM state WHERE id=1 AND value=?",
          op.token,
        );
        return 1;
      }
      if (op.kind === "set" && op.nx && row) return null;
      const value =
        op.kind === "increment" ? Number(row?.value ?? 0) + 1 : op.value;
      if (
        op.kind === "increment" &&
        (!Number.isSafeInteger(value) || Number(value) < 1)
      )
        throw Error("invalid_counter");
      const expires =
        op.kind === "increment" && row ? row.expires : now + op.ttl * 1000;
      this.ctx.storage.sql.exec(
        "INSERT INTO state(id,value,expires) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value, expires=excluded.expires",
        String(value),
        expires,
      );
      return op.kind === "increment" ? Number(value) : "OK";
    });
    // Expiry is enforced at every operation; alarms only reclaim physical storage.
    const row = this.ctx.storage.sql
      .exec<Row>("SELECT value, expires FROM state WHERE id=1")
      .toArray()[0];
    if (row) await this.ctx.storage.setAlarm(row.expires);
    return result;
  }
  ownerInspect(key: string): Row | null {
    if (
      !diagnosticsEnabled(this.env) ||
      !OWNER_KEYS.some((k) => k === key) ||
      this.ctx.id.toString() !==
        this.env.CONTACT_STATE.idFromName(key).toString()
    )
      throw Error("diagnostic_denied");
    // Read-only: no expiry cleanup, alarm reset, TTL extension or record reconstruction.
    const row = this.ctx.storage.sql
      .exec<Row>("SELECT value, expires FROM state WHERE id=1")
      .toArray()[0];
    return row
      ? {
          value: key.endsWith(":lock") ? "redacted" : row.value,
          expires: row.expires,
        }
      : null;
  }
  async alarm() {
    const row = this.ctx.storage.sql
      .exec<Row>("SELECT value, expires FROM state WHERE id=1")
      .toArray()[0];
    if (!row || row.expires <= Date.now())
      this.ctx.storage.sql.exec(
        "DELETE FROM state WHERE expires <= ?",
        Date.now(),
      );
    else await this.ctx.storage.setAlarm(row.expires);
  }
}
