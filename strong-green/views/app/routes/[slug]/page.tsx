import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MathText from "@/components/MathText";
import { getResearchRoute, globalRoutes, routesOverview } from "@/content/routes.mjs";
import { getPaper } from "@/lib/papers";
import "@/app/routes-layout.css";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return globalRoutes.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const route = getResearchRoute(slug);
  if (!route) return { title: "Route not found", robots: { index: false } };
  return { title: route.title, description: route.summary, alternates: { canonical: "/routes/" + slug } };
}

export default async function RoutePage({ params }: Props) {
  const { slug } = await params; const route = getResearchRoute(slug);
  if (!route) notFound();
  const paper = getPaper(route.paperSlug);
  return <div className="site-shell research-routes route-detail-page">
    <nav className="route-breadcrumb" aria-label="Research route navigation"><a href="/routes">← All research routes</a><a href="/results">Progress and proofs</a></nav>
    <header className="page-header routes-heading">
      <p className="eyebrow">Research route</p><h1>{route.title}</h1><p>{route.introduction}</p>
      <nav className="route-actions primary-route-actions" aria-label="Article and PDF">
        {route.proof && <a className="button formal-paper-link" href={route.proof.href}>{route.proof.label} →</a>}
        <a className="button formal-paper-link" href={"/papers/" + route.paperSlug}>Read the mathematical article →</a>
        <a className="button button-secondary" href={"/papers/" + route.paperSlug + ".pdf"} download>Download PDF{paper ? " · " + paper.pages + " pages" : ""}</a>
      </nav>
      {route.foundations && <p><a href={route.foundations.href}>{route.foundations.label}</a> · <a href="/about">Mathematical review status</a></p>}
    </header>
    <section className="route-conclusion" id="conclusion"><h2>The resulting pairing</h2><MathText className="route-notation" text={routesOverview.context} /><MathText text={route.conclusion} /><p className="route-status">{route.status}</p></section>
    <section className="route-logical-steps" id="logical-steps" aria-labelledby="route-steps-heading">
      <h2 id="route-steps-heading">The argument</h2><p>Each step states whether it is a required input, an open problem or a deduction under the stated hypotheses.</p>
      <ol>{route.steps.map(step => <li key={step.title}><p className="route-step-kind">{step.kind}</p><h3>{step.title}</h3><MathText text={step.text} /><a className="route-source-link" href={step.href}>{step.link} →</a></li>)}</ol>
    </section>
    <section className="route-progress" id="current-progress"><h2>What is established</h2><p>{route.progress}</p>{route.proof && <a className="route-source-link" href={route.proof.href}>{route.proof.label} →</a>}</section>
    {route.sections.map(section => <section className="route-mathematical-section" key={section.id} id={section.id}><h2>{section.title}</h2><MathText text={section.text} /><a className="route-source-link" href={section.href}>{section.link} →</a></section>)}
    <nav className="route-footer-links" aria-label="Other research routes">{globalRoutes.filter(other => other.slug !== slug).map(other => <a key={other.slug} href={"/routes/" + other.slug}>{other.title} →</a>)}</nav>
  </div>;
}
