import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "b", "i", "em", "strong", "p", "br", "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "a", "img", "table", "thead", "tbody", "tr", "th", "td",
  "span", "div", "blockquote", "pre", "code", "hr",
];

const ALLOWED_ATTR = ["href", "src", "alt", "title", "class", "target", "rel", "width", "height"];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}
