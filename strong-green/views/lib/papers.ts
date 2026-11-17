import programme from "@/content/papers/strong-g-programme.json";
import arithmeticProgramme from "@/content/papers/arithmetic-conjectures.json";
import green from "@/content/papers/green-constructions.json";
import arithmetic from "@/content/papers/arithmetic-reductions.json";
import metrics from "@/content/papers/determinant-metrics.json";
import globalHeight from "@/content/papers/global-height-pairing.json";
import pairingCases from "@/content/papers/pairing-constructions.json";
import obstructionRoute from "@/content/papers/obstruction-height-route.json";
import greenRoute from "@/content/papers/green-height-route.json";
import zhangRoute from "@/content/papers/zhang-height-route.json";

export type Paper = {
  slug:string; title:string; subtitle:string; category:string; summary:string;
  status:string; evidence:string; overview:string; entries:string[];
  revision:string; date:string; html:string; abstractHtml:string;
  toc:{id:string;level:number;number:string;title:string}[];
  pages:number; pdf:string; tex:string; pdfSha256:string; sourceSha256:string;
  htmlSha256:string; proofCount:number; formulaCount:number;
  sources:{file:string;sha256:string}[]; statements:{kind:string;count:number}[];
};
export const papers = [obstructionRoute,greenRoute,zhangRoute,programme,arithmeticProgramme,globalHeight,pairingCases,green,arithmetic,metrics] as Paper[];
export const getPaper = (slug:string) => papers.find(paper=>paper.slug===slug);
export const papersForEntry = (id:string) => papers.filter(paper=>paper.entries.includes(id));
