import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {validateAcknowledgements} from '../lib/acknowledgements.mjs';

const categoryLabels = {
  general: 'General feedback', question: 'Clarification', correction: 'Correction',
  reference: 'Reference', suggestion: 'Idea or improvement', proof: 'Proof contribution',
  counterexample: 'Counterexample', formalization: 'Formalization',
};
const displayDate = value => new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
}).format(new Date(value + 'T00:00:00Z'));

// These pages are current editorial infrastructure, not new mathematical
// editions. The only inputs are reviewed, version-controlled public records.
// In particular, a closed GitHub Issue is never automatically treated as adopted.
export function renderProjectAcknowledgements({record, project, repository, url, origin, esc, breadcrumbs}) {
  const route = '/projects/' + project.id + '/acknowledgements/';
  const projectRoute = '/projects/' + project.id + '/';
  const feedback = url('/feedback/') + '?' + new URLSearchParams({
    project: project.id, page: origin + route,
  }).toString();
  const gh = 'https://github.com/' + repository;
  const thanks = record.acknowledgements.length
    ? `<ul class="ack-thanks-list">${record.acknowledgements.map(item => `<li id="${esc(item.id)}"><p>${esc(item.text)}</p></li>`).join('')}</ul>`
    : '<p class="ack-empty">Individual acknowledgements will be recorded here as the project develops.</p>';
  const contributions = record.contributions.length
    ? `<ol class="ack-contribution-list">${record.contributions.map(item => {
      const credit = item.credit.mode === 'unattributed' ? 'Contributor not named' : item.credit.displayName;
      return `<li id="${esc(item.id)}"><article><p class="ack-category">${esc(categoryLabels[item.category])}</p><h3>${esc(credit)}</h3><p>${esc(item.summary)}</p><p class="ack-entry-date">Accepted <time datetime="${esc(item.acceptedAt)}">${esc(displayDate(item.acceptedAt))}</time> · Incorporated <time datetime="${esc(item.incorporatedAt)}">${esc(displayDate(item.incorporatedAt))}</time></p><nav class="ack-entry-links" aria-label="Evidence for ${esc(item.id)}"><a href="${esc(item.feedbackUrl)}">Original feedback</a><a href="${esc(item.acceptanceUrl)}">Acceptance record</a><a href="${esc(item.changeUrl)}">Incorporating change</a></nav></article></li>`;
    }).join('')}</ol>`
    : '<div class="ack-empty-state"><p>No contributions from accepted feedback have been recorded yet.</p><p>As feedback is adopted and incorporated, the contribution and its supporting links will appear here.</p></div>';
  const html = `<main id="main-content" class="wrap ack-page">
${breadcrumbs([[project.category === 'foundations' ? 'Foundations' : 'Research', project.category === 'foundations' ? '/foundations/' : '/research/'], [project.title, projectRoute], ['Acknowledgements']])}
<nav class="ack-project-nav" aria-label="Project resources"><a href="${url(projectRoute)}">Project overview</a><a href="${url(route)}" aria-current="page">Acknowledgements</a><a href="${esc(feedback)}">Project feedback</a></nav>
<header class="ack-header"><p class="eyebrow">WITH THANKS</p><h1>Acknowledgements</h1><p class="ack-project-title">${esc(project.title)}</p><p class="ack-intro">We are grateful to the people who share research and help this project develop.</p></header>
<div class="ack-layout"><div class="ack-main">
<section class="ack-section" id="general-acknowledgements"><h2>Research sharing and support</h2>${thanks}</section>
<section class="ack-section" id="accepted-feedback"><h2>Contributions from accepted feedback</h2><p>Specific contributions are recorded after a maintainer accepts the feedback and incorporates it into a published change.</p>${contributions}</section>
</div><aside class="ack-sidebar" aria-labelledby="ack-policy-title"><h2 id="ack-policy-title">How credit is recorded</h2><p>Each adopted contribution links to its discussion, acceptance record and incorporating change. Closing an issue alone does not establish acceptance.</p><p>We use the contributor’s chosen public name or username only with permission. A contributor can also choose not to be named here.</p><p>Acknowledgement recognises the contribution described; it does not imply co-authorship, endorsement or a review of the project as a whole.</p><a href="${url('/feedback/guide/')}#acknowledgements-and-credit">Read the contribution guide</a></aside></div>
<section class="ack-contribute" aria-labelledby="ack-contribute-title"><div><h2 id="ack-contribute-title">Help the project develop</h2><p>Questions, corrections, references and suggestions are welcome through the shared feedback board.</p></div><a class="button button-dark" href="${esc(feedback)}">Contribute or suggest a correction</a></section>
<footer class="ack-record-footer"><p>Record updated <time datetime="${esc(record.updatedAt)}">${esc(displayDate(record.updatedAt))}</time>. These pages update with reviewed website releases.</p><nav aria-label="Acknowledgement records"><a href="${gh}/commits/main/content/acknowledgements/${encodeURIComponent(project.id)}.json">Acknowledgement history</a><a href="${gh}/commits/main/content/feedback/adopted.json">Accepted-feedback history</a><a href="${url('/acknowledgements/')}">All project acknowledgements</a></nav></footer>
</main>`;
  return {
    route, title: 'Acknowledgements — ' + project.title,
    description: 'Acknowledgements and contributions from accepted feedback for ' + project.title + '.',
    html,
  };
}

export async function buildAcknowledgements({root, bundles, repository, url, origin, esc, breadcrumbs}) {
  const directory = path.join(root, 'content', 'acknowledgements');
  const files = (await readdir(directory)).filter(file => file.endsWith('.json')).sort();
  const records = await Promise.all(files.map(async file => {
    const record = JSON.parse(await readFile(path.join(directory, file), 'utf8'));
    if (file !== record.projectId + '.json') throw Error('Acknowledgement filename must match projectId');
    return record;
  }));
  const ledger = JSON.parse(await readFile(path.join(root, 'content/feedback/adopted.json'), 'utf8'));
  const data = validateAcknowledgements(records, ledger, bundles, repository);
  const pages = bundles.map(bundle => renderProjectAcknowledgements({
    record: data.byProject[bundle.project.id], project: bundle.project,
    repository, url, origin, esc, breadcrumbs,
  }));
  const cards = bundles.map(({project}) => {
    const record = data.byProject[project.id];
    const note = record.acknowledgements.length || record.contributions.length
      ? `${record.acknowledgements.length} acknowledgement${record.acknowledgements.length === 1 ? '' : 's'} · ${record.contributions.length} adopted contribution${record.contributions.length === 1 ? '' : 's'}`
      : 'A dedicated record, updated as contributions are incorporated.';
    return `<li><a href="${url('/projects/' + project.id + '/acknowledgements/')}"><span class="ack-category">${project.category === 'foundations' ? 'Foundations' : 'Research'}</span><h2>${esc(project.title)}</h2><p>${esc(note)}</p></a></li>`;
  }).join('');
  pages.unshift({
    route: '/acknowledgements/', title: 'Project acknowledgements',
    description: 'Project-specific acknowledgements and contributions from accepted feedback across OpenMath.',
    html: `<main id="main-content" class="wrap ack-page">${breadcrumbs([['Acknowledgements']])}<header class="ack-header"><p class="eyebrow">OUR CONTRIBUTORS</p><h1>Project acknowledgements</h1><p class="ack-intro">Each project keeps its own record of research shared with it and contributions incorporated through feedback.</p></header><ul class="ack-project-list">${cards}</ul><p class="ack-index-note">General thanks are distinct from contributions adopted into the project. Each accepted-feedback entry identifies the actual change, with permission for the displayed credit.</p><a class="text-link" href="${url('/feedback/guide/')}#acknowledgements-and-credit">How acknowledgements are updated</a></main>`,
  });
  const searchIndex = pages.map(page => ({
    title: page.title, summary: page.description,
    keywords: ['acknowledgements', 'contributors', 'accepted feedback'],
    link: url(page.route), category: 'acknowledgements',
    body: page.route === '/acknowledgements/' ? page.description : (() => {
      const projectId = page.route.split('/')[2];
      const record = data.byProject[projectId];
      return [page.description, ...record.acknowledgements.map(item => item.text), ...record.contributions.map(item => [item.credit.displayName || '', item.summary].join(' '))].join(' ');
    })(),
  }));
  return {pages, searchIndex, data};
}
