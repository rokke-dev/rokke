import { wrapAsUploadedFile } from "@rokke/validation";
export async function readBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) return request.json();
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const result: Record<string, string | ReturnType<typeof wrapAsUploadedFile>> = {};
    for (const [key, value] of formData.entries()) {
      result[key] = (value && typeof value === "object" && typeof (value as any).arrayBuffer === "function") 
        ? wrapAsUploadedFile(value as File) 
        : (value as string);
    }
    return result;
  }
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(await request.text()));
  }
  return undefined; 
}
