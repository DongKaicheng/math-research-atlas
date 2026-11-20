import {contentsRoute, coverageRoute, escape, foundationsPdfLink, foundationsSearchForm, foundationsShell, link, project} from './foundations-layout.mjs';
import {foundationsTopicLinks} from './build-foundations-topics.mjs';

export const foundationsContentsRoute = contentsRoute;

export function foundationsHome({release, title, description, history, url, canonical, redirect, topics, brand}) {
  const {current, meta} = release;
  const fixed = project+'editions/'+current.edition+'/';
  const context = {project:current.project, version:current.edition, page:url(project)};
  const feedback = url('/feedback/')+'?'+new URLSearchParams(context);
  const earlier = history.map(({revision}) => link(url(project+'versions/'+revision+'/'),'Version '+revision)).join(' · ');
  const schema = JSON.stringify({'@context':'https://schema.org','@type':'CollectionPage','@id':canonical(project)+'#collection',name:title,
    url:canonical(project),description,isPartOf:{'@id':canonical('/')+'#website'},
    about:['Non-Archimedean geometry','Berkovich analytic spaces','Formal models','Tropical geometry','Skeleta']}).replaceAll('<','\\u003c');

  return foundationsShell(project,title,`
    <header class="foundation-hero" id="main-content">
      <h1>${escape(title)}</h1>
      <p class="page-lead">An open reference for definitions, theorems and proofs in non-Archimedean geometry.</p>
      ${foundationsSearchForm({id:'foundations-query',url})}
      ${foundationsPdfLink(url(meta.reader.path))}
    </header>
    <div class="home-information">
      <section id="motivation"><h2>About the project</h2>
        <p id="questions">The book starts with valued fields, Banach and affinoid algebras, and Berkovich analytic spaces. It develops reduction, formal models, analytic curves and skeleta, then uses tropical geometry to study differential forms, currents, metrics and intersection products.</p>
        <p id="results">Permanent NAG Tags link entries to their statements, arguments and proof status, including the hypotheses under which a result can be used.</p>
      </section>
      ${topics ? `<section id="topics"><h2>Browse by mathematical topic</h2><p>Follow a subject from its basic definitions to the chapters where it is developed.</p>${foundationsTopicLinks(topics,url)}<p>${link(url(project+'topics/'),'View all topic guides')}</p></section>` : ''}
      <section aria-labelledby="ai-disclosure"><h2 id="ai-disclosure">AI disclosure</h2>
        <p>AI generated most of the mathematical content in this project. We welcome readers to use AI to develop and check proofs for ${link(url(coverageRoute),'open NAG Tags')}.</p>
        <p>For a proposed proof, include the Tag, the exact hypotheses, an argument for the missing step and any references. Please say how you used AI.</p>
      </section>
      <section id="feedback"><h2>Feedback and corrections</h2>
        <p>Send corrections, suggestions and proposed proofs through the shared OpenMath feedback page. Include the NAG number when available.</p>
        <p class="home-feedback-links">${link(feedback,'Open project feedback')}</p>
      </section>
    </div>
    <footer class="foundation-editions" id="programme"><span id="editions"></span>
      <span>${link(url(fixed),'Fixed edition')}</span>
      ${earlier ? `<span>${earlier}</span>` : ''}
      <span>${link(url(project+'acknowledgements/'),'Acknowledgements')}</span>
    </footer>`,{url,canonical:canonical(project),description,layout:'foundations-home',brand,extra:
      '<script type="application/ld+json">'+schema+'</script>'+redirect});
}
