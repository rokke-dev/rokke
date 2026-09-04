export function renderCompiled(compiledHtml: string, data: Record<string, unknown>): Response {
  return new HTMLRewriter()
    .on("t-for", forVisitor(data))
    .on("t-if", ifVisitor(data))
    .on("*", textInterpolationVisitor(data))
    .transform(new Response(compiledHtml));
}
function textInterpolationVisitor(data: Record<string, unknown>) {
  return {
    text(t: { text: string; replace: (s: string, opts?: { html: boolean }) => void }) {
      const replaced = t.text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, expr) => escapeHtml(String(resolvePath(data, expr))));
      if (replaced !== t.text) t.replace(replaced, { html: true });
    },
  };
}
function forVisitor(data: Record<string, unknown>) {
  return {}; 
}
function ifVisitor(data: Record<string, unknown>) {
  return {}; 
}
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function resolvePath(data: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => (acc as Record<string, unknown> | undefined)?.[key], data);
}