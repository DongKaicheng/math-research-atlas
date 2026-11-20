export const project = '/projects/foundations/';
export const contentsRoute = project + 'contents/';
export const coverageRoute = project + 'coverage/';
export const guideRoute = project + 'guide/';
export const searchRoute = project + 'search/';
export const topicsRoute = project + 'topics/';

export const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const link = (href,title) => `<a href="${escape(href)}">${escape(title)}</a>`;

const navigation = [
  [contentsRoute,'Table of contents'], [topicsRoute,'Topics'], [coverageRoute,'Tag index'], [guideRoute,'Reading guide'],
  [searchRoute,'Search'], ['/feedback/?project=foundations','Feedback'],
];

export function foundationsShell(route,title,body,{url = path=>path, canonical = route, description, extra = '', layout = '', brand = 'OpenMath'} = {}) {
  const styles = url('/assets/foundations-native.css');
  const script = url('/assets/foundations-interface.js');
  const nav = navigation.map(([href,label]) => `<a href="${escape(url(href))}"${href === route || href === topicsRoute && route.startsWith(topicsRoute) ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  const pageTitle = title + ' · OpenMath Foundations';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(pageTitle)}</title><link rel="canonical" href="${escape(canonical)}">
  ${description ? `<meta name="description" content="${escape(description)}">` : ''}
  <meta property="og:type" content="website"><meta property="og:title" content="${escape(pageTitle)}"><meta property="og:url" content="${escape(canonical)}"><meta property="og:site_name" content="${escape(brand)}">
  ${description ? `<meta property="og:description" content="${escape(description)}">` : ''}<meta name="twitter:card" content="summary">
  <link rel="icon" type="image/svg+xml" href="${escape(url('/assets/favicon.svg'))}">
  <link rel="stylesheet" href="${escape(styles)}">${extra}<script defer src="${escape(script)}"></script></head><body>
  <a class="skip" href="#main">Skip to content</a><header class="site-header"><div class="foundation-masthead">
    <div class="foundation-brand">${link(url('/'),'OpenMath')}<span aria-hidden="true">/</span>${link(url(project),'Foundations')}</div>
    <nav class="foundation-nav" aria-label="Foundations navigation">${nav}</nav></div></header>
  <main id="main"${layout ? ` class="${layout}"` : ''}>${body}</main></body></html>`;
}

export function foundationsSearchForm({id = 'atlas-search', formId, url = path=>path} = {}) {
  return `<form${formId ? ` id="${formId}"` : ''} class="foundation-search" data-project="foundations" action="${escape(url(searchRoute))}" method="get" role="search">
    <label for="${id}">${formId ? 'Keyword or NAG number' : 'Search Foundations'}</label><div class="search-field">
    <input id="${id}" name="q" type="search" maxlength="200" placeholder="Keyword or NAG number" required>
    <button type="submit">Search</button></div></form>`;
}

export function foundationsPdfLink(href) {
  return `<p class="reader-download"><a href="${escape(href)}" download="Non-Archimedean-Geometry-Foundations.pdf">Download the English PDF</a></p>`;
}
