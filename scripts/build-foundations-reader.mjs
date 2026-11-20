import {feedbackIssueUrl} from '../lib/feedback.mjs';
import {contentsRoute, escape, foundationsSearchForm, foundationsShell, link, project} from './foundations-layout.mjs';

export const foundationsContentsRoute = contentsRoute;

export function foundationsHome({release, title, description, history, url, repository, canonical, redirect, brand}) {
  const {current} = release;
  const fixed = project+'editions/'+current.edition+'/';
  const context = {project:current.project, version:current.edition, page:url(project)};
  const feedback = url('/feedback/')+'?'+new URLSearchParams(context);
  const suggestion = feedbackIssueUrl(repository,'suggestion',context);
  const earlier = history.map(({revision}) => link(url(project+'versions/'+revision+'/'),'Version '+revision)).join(' · ');
  const schema = JSON.stringify({'@context':'https://schema.org','@type':'CollectionPage',name:title,
    url:canonical(project),description,isPartOf:{'@id':canonical('/')+'#website'},
    about:['Non-Archimedean geometry','Berkovich analytic spaces','Formal models','Tropical geometry','Skeleta']}).replaceAll('<','\\u003c');

  return foundationsShell(project,title,`
    <header class="foundation-hero" id="main-content">
      <h1>${escape(title)}</h1>
      <p class="page-lead">An open reference for definitions, theorems and proofs in non-Archimedean geometry.</p>
      ${foundationsSearchForm({id:'foundations-query',url})}
    </header>
    <div class="home-information">
      <section id="motivation"><h2>About the project</h2>
        <p id="questions">Foundations brings together existing mathematics so readers can study, cite and build on it.</p>
        <p id="results">Each NAG Tag gives a permanent reference to a statement or proof question and records its current status.</p>
      </section>
      <section id="feedback"><h2>Feedback and corrections</h2>
        <p>Tell us which statement or argument you are commenting on and what you would change. Include the NAG number when available.</p>
        <p class="home-feedback-links">${link(feedback,'Open the feedback board')}${link(suggestion,'Suggest a change on GitHub')}</p>
      </section>
    </div>
    <footer class="foundation-editions" id="programme"><span id="editions"></span>
      <span>${link(url(fixed),'Fixed edition and PDF')}</span>
      ${earlier ? `<span>${earlier}</span>` : ''}
      <span>${link(url(project+'acknowledgements/'),'Acknowledgements')}</span>
    </footer>`,{url,canonical:canonical(project),description,layout:'foundations-home',extra:
      `<meta property="og:site_name" content="${escape(brand)}">`+'<script type="application/ld+json">'+schema+'</script>'+redirect});
}
