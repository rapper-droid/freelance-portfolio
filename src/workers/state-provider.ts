import { env } from "cloudflare:workers";
import type { StateOperation } from "./contact-state";

// Supports only the application's bounded storage operations, never arbitrary Lua.
export async function stateCommand(
  ...args: (string | number)[]
): Promise<string | number | null> {
  if (!env.CONTACT_STATE) throw Error("state_configuration");
  let key: string, op: StateOperation;
  if (args[0] === "GET" && args.length === 2) {
    key = String(args[1]);
    op = { kind: "get" };
  } else if (args[0] === "SET" && (args.length === 5 || args.length === 6)) {
    key = String(args[1]);
    const nx = args.length === 6;
    if ((nx && args[3] !== "NX") || args[nx ? 4 : 3] !== "EX")
      throw Error("unsupported_state_operation");
    op = {
      kind: "set",
      value: String(args[2]),
      nx,
      ttl: Number(args[nx ? 5 : 4]),
    };
  } else if (args[0] === "EVAL" && args[2] === 1 && args.length === 5) {
    key = String(args[3]);
    if (
      args[1] ===
      "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n"
    )
      op = { kind: "increment", ttl: Number(args[4]) };
    else if (
      args[1] ===
      "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end"
    )
      op = { kind: "unlock", token: String(args[4]) };
    else throw Error("unsupported_state_operation");
  } else throw Error("unsupported_state_operation");
  if (!key.startsWith("portfolio:") || key.length > 256)
    throw Error("invalid_state_key");
  // Network/storage errors propagate: the route returns 503, never an in-memory fallback.
  return env.CONTACT_STATE.getByName(key).execute(op);
}
