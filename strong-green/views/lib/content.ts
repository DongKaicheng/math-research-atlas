import raw from "@/content/bundle.json";
export type Reference = { id?: string; label: string; url: string; locator?: string; description?: string };
export type Entry = {
  id: string; kind: string; title: string; summary: string; statement: string; status: string; topic: string;
  proof?: string; proofMode?: string; motivation?: string; approach?: string; dependencyNotes?: Record<string, string>;
  dependencies: string[]; references: Reference[]; contentHash: string;
  source: { file: string; locator: string; sha256: string; url?: string };
};
export const bundle = raw;
export const project = raw.project;
export const edition = raw.edition;
export const entries = raw.entries as Entry[];
export const bibliography = raw.bibliography as Reference[];
export const sourceFiles = raw.sourceFiles;
export const manuscripts = raw.manuscripts;
export const entryById = new Map(entries.map(entry => [entry.id, entry]));
export const statusLabels: Record<string, string> = {
  open: "Open", draft: "Draft · audit pending", conditional: "Conditional",
  proved: "Internal proof available", reviewed: "Review recorded", withdrawn: "Withdrawn",
};
export const kindLabels: Record<string, string> = { conjecture: "Conjecture", result: "Result", definition: "Definition / conventions", question: "Research question", note: "Mathematical note" };
export function getEntry(id: string) { return entryById.get(id); }
export function dependents(id: string) { return entries.filter(entry => entry.dependencies.includes(id)); }
export function label(entry: Entry) { return entry.kind === "definition" && entry.status === "draft" ? "Definition" : statusLabels[entry.status] || entry.status; }
export function sourcePdf(entry: Entry) {
  // Current papers provide unsigned PDFs. Historical signed manuscripts are
  // provenance records, not assets of this public publication.
  return undefined;
}
