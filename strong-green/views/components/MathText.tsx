import { renderMathMarkdown } from "@/lib/math";
export default function MathText({ text, className = "prose" }: { text?: string; className?: string }) {
  if (!text) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: renderMathMarkdown(text) }} />;
}
