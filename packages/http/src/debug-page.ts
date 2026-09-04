import type { HttpRequestContext } from "./http-request-context";
export function renderDebugPage(error: Error, ctx: HttpRequestContext): Response {
  const html = `<!doctype html><html><body>
<h1>${escapeHtml(error.name)}</h1>
<p>${escapeHtml(error.message)}</p>
<pre>${escapeHtml(error.stack ?? "")}</pre>
<p>correlationId: ${escapeHtml(ctx.correlationId)}</p>
</body></html>`;
  return new Response(html, { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
export function renderGenericErrorPage(correlationId: string): Response {
  const html = `<!doctype html><html><body><h1>Algo salió mal</h1><p>Código de referencia: ${escapeHtml(correlationId)}</p></body></html>`;
  return new Response(html, { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
function escapeHtml(input: string): string {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
