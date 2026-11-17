import katex from "katex";
import { Marked } from "marked";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const markdown = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    html({ text }) { return escapeHtml(text); },
    link({ href, title, tokens }) {
      const safe = /^(https?:\/\/|\/(?!\/)|#)/i.test(href);
      const label = this.parser.parseInline(tokens);
      if (!safe) return label;
      return '<a href="' + escapeHtml(href) + '"' + (title ? ' title="' + escapeHtml(title) + '"' : '') + (href.startsWith("http") ? ' rel="noopener noreferrer"' : "") + ">" + label + "</a>";
    },
  },
});
export function renderMathMarkdown(text: string): string {
  const slots: string[] = [];
  const protectedText = text.replace(/\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g, (_match, display, inline) => {
    const isDisplay = display !== undefined;
    const html = katex.renderToString(isDisplay ? display : inline, {
      displayMode: isDisplay, throwOnError: true, strict: "ignore", trust: false,
      macros: { "\\CH": "\\operatorname{CH}", "\\Q": "\\mathbf{Q}", "\\R": "\\mathbf{R}", "\\Z": "\\mathbf{Z}", "\\an": "\\mathrm{an}" },
    });
    const token = "MATHSLOTRESEARCH" + slots.length + "END";
    slots.push(isDisplay ? '<div class="math-block">' + html + "</div>" : html);
    return isDisplay ? "\n\n" + token + "\n\n" : token;
  });
  let html = markdown.parse(protectedText, { async: false }) as string;
  html = html.replace(/<p>(MATHSLOTRESEARCH\d+END)<\/p>/g, "$1");
  return html.replace(/MATHSLOTRESEARCH(\d+)END/g, (_m, index) => slots[Number(index)]);
}
