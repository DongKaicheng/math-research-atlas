import {feedbackIssueUrl} from '../lib/feedback.mjs';
import {foundationsBookRoute} from './build-foundations-web.mjs';

const project = '/projects/foundations/';
export const foundationsContentsRoute = project + 'contents/';

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => (
  {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]
));
const link = (href, title) => `<a href="${escapeHtml(href)}">${escapeHtml(title)}</a>`;

export function foundationsHome({release, title, trail, history, url, repository}) {
  const {current, rows} = release;
  const fixed = project + 'editions/' + current.edition + '/';
  const coverage = project + 'coverage/';
  const context = {project: current.project, version: current.edition, page: url(project)};
  const feedback = url('/feedback/') + '?' + new URLSearchParams(context);
  const suggestion = feedbackIssueUrl(repository, 'suggestion', context);
  const localLink = (route, label) => link(url(route), label);
  const [proof, gap] = ['NAG-002462', 'NAG-002405'].map(id => rows.find(row => row.id === id));
  requireReader(proof && gap, 'the homepage examples must belong to the published edition');
  const earlier = history.map(({revision}) =>
    localLink(project + 'versions/' + revision + '/', 'Version ' + revision)).join(' · ');

  return `<main id="main-content" class="wrap foundations-home">
    ${trail}
    <header class="foundations-home-header">
      <h1>${escapeHtml(title)}</h1>
      <p class="foundations-home-deck">A reference for definitions, theorems and proofs in non-Archimedean geometry, organized by chapter and searchable by permanent NAG number.</p>
      <p class="foundations-home-version">Version ${current.revision} · ${escapeHtml(current.edition)}</p>
      <nav class="foundations-home-nav" aria-label="Foundations project navigation">
        <a class="button button-dark" href="${escapeHtml(url(foundationsContentsRoute))}">Table of contents</a>
        ${link('#foundations-query', 'Search')}
        ${localLink(coverage, 'Tag and proof coverage')}
        ${localLink(foundationsBookRoute, 'Web reader')}
        ${link('#editions', 'Editions')}
        ${link('#feedback', 'Feedback')}
      </nav>
      <form class="foundations-reading-search" action="${escapeHtml(url('/search/'))}" method="get" role="search" aria-label="Search Foundations">
        <input type="hidden" name="project" value="${escapeHtml(current.project)}">
        <label for="foundations-query">Search Foundations</label>
        <div><input type="search" id="foundations-query" name="q" placeholder="Keyword or ${proof.id}" maxlength="200" required><button class="button button-dark" type="submit">Search</button></div>
      </form>
    </header>

    <section id="motivation" class="foundations-home-section">
      <h2>About the project</h2>
      <div>
        <p id="questions">This project brings together existing mathematics in non-Archimedean geometry. It organizes definitions, results and proofs into a shared reference that readers can study, cite and build on.</p>
        <p>We maintain the reference openly to support mathematical exchange and contributions to shared knowledge. Readers are welcome to clarify an argument, suggest a reference or contribute mathematics through the project’s public discussion.</p>
      </div>
    </section>

    <section id="results" class="foundations-home-section">
      <h2>How to use the reference</h2>
      <div>
        <ol class="foundations-home-guide">
          <li><strong>Read by chapter.</strong> Use the ${localLink(foundationsContentsRoute, 'table of contents')} to browse chapters and jump to individual sections.</li>
          <li><strong>Read or cite a result.</strong> Follow the Tag in the chapter, or ${link('#foundations-query', 'search by keyword or NAG number')}. The Tag page gives the statement, available proof and permanent citation.</li>
          <li><strong>Check proof coverage.</strong> The ${localLink(coverage, 'coverage register')} shows each chapter’s Tag total, open proof obligations in the manuscript, and statements awaiting permanent Tags.</li>
        </ol>
        <p>Start with ${localLink(proof.link, proof.id + ' · ' + proof.title)} to read a complete selected proof. The linked record ${localLink(gap.link, gap.id + ' · ' + gap.title)} documents a historical proof gap in the broader argument.</p>
      </div>
    </section>

    <section id="programme" class="foundations-home-section">
      <h2 id="editions">Reading edition and archive</h2>
      <div>
        <p>${localLink(foundationsBookRoute, 'Read the full edition on the web')}. The ${localLink(fixed, 'fixed Version ' + current.revision + ' edition')} remains available for exact citations.</p>
        ${earlier ? `<p>Earlier edition · ${earlier}</p>` : ''}
      </div>
    </section>

    <section id="feedback" class="foundations-home-section">
      <h2>Feedback and suggestions</h2>
      <div>
        <p>We welcome corrections to statements and proofs, references that could help resolve an open step, and suggestions for making the chapters easier to read or navigate. For comments on a result, include its NAG number, the relevant passage or link, and the change you propose.</p>
        <div class="foundations-home-actions">
          <a class="button button-dark" href="${escapeHtml(feedback)}">Open the feedback board</a>
          ${link(suggestion, 'Suggest an improvement on GitHub')}
        </div>
        <p>${localLink(project + 'acknowledgements/', 'Acknowledgements and adopted contributions')}</p>
      </div>
    </section>
  </main>`;
}

function requireReader(condition, message) {
  if (!condition) throw Error('Foundations reading navigation: ' + message);
}
