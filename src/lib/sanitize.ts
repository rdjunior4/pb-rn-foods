/**
 * Sanitiza HTML simples para páginas CMS
 * Remove scripts, event handlers e tags perigosas
 */
export function sanitizeHtml(html: string): string {
  // Remove scripts
  let result = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  
  // Remove event handlers (onclick, onerror, etc.)
  result = result.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
  result = result.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, "");
  
  // Remove javascript: URLs
  result = result.replace(/href\s*=\s*["']?\s*javascript:[^"']*["']/gi, "");
  result = result.replace(/src\s*=\s*["']?\s*javascript:[^"']*["']/gi, "");
  
  // Remove data: URLs (exceto imagens)
  result = result.replace(/src\s*=\s*["']?\s*data:text\/(?!image)[^"']*["']/gi, "");
  
  // Remove tags perigosas
  const dangerousTags = ["iframe", "object", "embed", "form", "input", "textarea", "select", "button", "link", "meta", "base"];
  for (const tag of dangerousTags) {
    const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!</${tag}>)<[^<]*)*</${tag}>`, "gi");
    result = result.replace(regex, "");
    const regexSelfClosing = new RegExp(`<${tag}\\b[^>]*/>`, "gi");
    result = result.replace(regexSelfClosing, "");
  }
  
  // Remove style tags (podem conter expressões CSS perigosas)
  result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  
  // Remove expression() do CSS inline
  result = result.replace(/expression\s*\([^)]*\)/gi, "");
  result = result.replace(/@import[^;]*;/gi, "");
  
  return result;
}
