export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initServerMonitoring } = await import("./lib/server-monitoring");
    initServerMonitoring();
  }
}
export async function onRequestError() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { reportFailure } = await import("./lib/server-monitoring");
    await reportFailure("server_render");
  }
}
