import type { Metadata } from "next";
import MathText from "@/components/MathText";
import { globalRoutes, localApproaches, routesOverview } from "@/content/routes.mjs";
import "@/app/routes-layout.css";

export const metadata: Metadata = {
  title: "Routes to Beilinson–Bloch height pairings",
  description: "Local curvature obstructions, zero-curvature Green forms, and Shou-Wu Zhang’s admissible arithmetic liftings. Separate articles and PDFs for each approach.",
  alternates: { canonical: "/routes" },
};

export default function RoutesPage() {
  return <div className="site-shell research-routes routes-index">
    <header className="page-header routes-heading">
      <p className="eyebrow">Research routes</p><h1>{routesOverview.title}</h1><p>{routesOverview.summary}</p>
    </header>
    <section className="routes-common-target" aria-labelledby="routes-target-heading">
      <h2 id="routes-target-heading">The existence problem</h2>
      <MathText text={routesOverview.context} /><MathText text={routesOverview.target} />
      <p>The aim is a pairing on rational-equivalence classes, compatible with local intersection theory and its prescribed normalizations. <a href={routesOverview.targetHref}>Full mathematical statement →</a></p>
    </section>
    <div className="route-index-list">
      {globalRoutes.map((route, index) => <section className="route-index-item" id={route.id} key={route.id}>
        <p className="route-number">Route {index + 1}</p>
        <div><h2><a href={"/routes/" + route.slug}>{route.title}</a></h2><p>{route.summary}</p>
          <p className="route-index-difficulty"><strong>Main difficulty.</strong> {route.difficulty}</p>
          <nav className="route-actions" aria-label={route.title}>
            <a className="route-source-link" href={"/routes/" + route.slug}>Read this route →</a>
            {route.proof && <a className="route-source-link" href={route.proof.href}>{route.proof.label} →</a>}
            <a className="route-source-link" href={"/papers/" + route.paperSlug}>Mathematical article →</a>
            <a className="route-source-link" href={"/papers/" + route.paperSlug + ".pdf"} download>PDF ↓</a>
          </nav>
        </div>
      </section>)}
    </div>
    <aside className="routes-related"><h2>Local methods</h2><p>These methods address parts of the first two routes; they are not additional global existence theorems.</p>
      <nav aria-label="Local approaches">{localApproaches.map(item => <a id={item.id} key={item.id} href={item.href}>{item.title} →</a>)}</nav>
    </aside>
  </div>;
}
