import {applicationIssueUrl} from '../lib/feedback.mjs';

export function validateAdministrationConfig(value) {
  if (value?.schemaVersion !== 1 || !['preparing', 'ready'].includes(value.state)) throw Error('Invalid administration configuration');
  const parsed = {};
  for (const field of ['managementUrl', 'aiManagementUrl']) {
    if (value[field] === null) { parsed[field] = null; continue; }
    if (typeof value[field] !== 'string') throw Error('Invalid administration URL: ' + field);
    const u = new URL(value[field]);
    if (u.protocol !== 'https:' || u.username || u.password || u.search || u.hash) throw Error('Unsafe administration URL: ' + field);
    parsed[field] = u.href;
  }
  if (value.state === 'ready' && (!parsed.managementUrl || !parsed.aiManagementUrl)) throw Error('Ready administration needs verified workspace and AI URLs');
  if (parsed.managementUrl && parsed.aiManagementUrl && new URL(parsed.managementUrl).origin !== new URL(parsed.aiManagementUrl).origin) throw Error('Management and AI entry must share their verified origin');
  return {...parsed, state: value.state};
}

export function buildCommunityPages({brand, repository, management, esc, url, heading, breadcrumbs}) {
  const config = validateAdministrationConfig(management);
  const proposal = applicationIssueUrl(repository, 'project-proposal');
  const manager = applicationIssueUrl(repository, 'maintainer-application');
  const action = (href, text, secondary = false) => `<a class="button ${secondary ? 'button-outline' : 'button-dark'}" href="${esc(href)}">${esc(text)}</a>`;
  const section = (id, title, body) => `<section class="community-section" id="${id}"><h2>${title}</h2>${body}</section>`;
  const shell = (title, description, trail, body) => `<main id="main-content" class="wrap index-page community-page">${breadcrumbs(trail)}${heading('OPEN MATHEMATICAL COLLABORATION', title, description)}${body}</main>`;
  const publicNote = '<p class="community-note">The button opens a draft on GitHub. Review and submit it there. Your GitHub username, text, links and attachments will be public.</p>';
  const managementEntry = (ai = false) => config.state === 'ready'
    ? action(ai ? config.aiManagementUrl : config.managementUrl, ai ? 'Open AI management' : 'Open management workspace')
    : '<p class="community-connection-note">The management workspace is being connected. Project proposals and manager applications are open through the links below.</p>';
  const pages = [
    {
      route: '/contribute/', title: 'Contribute to OpenMath',
      description: 'Propose a new mathematical project or apply to help manage a project. OpenMath welcomes contributions across mathematical subjects.',
      html: shell('Help build the next part of OpenMath.', 'New projects and project managers are welcome. Bring a mathematical question, a body of theory, or the time to help a project develop.', [['Contribute']],
        `<div class="community-options"><article><p class="eyebrow">NEW PROJECTS</p><h2>Bring a project</h2><p>Propose a foundations reference, a research programme, or clearly separated parts of both. We welcome subjects beyond the current collection.</p>${action(url('/contribute/projects/'), 'Propose a project')}</article><article><p class="eyebrow">PROJECT MANAGERS</p><h2>Help a project grow</h2><p>Review contributions, improve exposition, maintain logical maps, or look after feedback. A focused, sustainable contribution is welcome.</p>${action(url('/contribute/maintainers/'), 'Apply to be a manager')}</article></div>`
        + section('how-we-work', 'A clear home for shared work', '<p>Projects retain their own mathematical scope, sources, permanent references and revision history. Foundations projects organise definitions and complete proofs; research projects describe conjectures, available results and the work that remains.</p><p>The site owner decides which new projects to accept and appoints project managers. Each manager receives an explicit project scope; one person may help with several projects.</p>')
        + section('other-contributions', 'Start with a contribution', `<p>You can also ask a question, suggest a reference, report an error or submit a proof through our shared discussion board.</p><div class="community-actions">${action(url('/feedback/'), 'Read and share feedback', true)}${action(url('/admin/'), 'Management access', true)}</div>`)),
    },
    {
      route: '/contribute/projects/', title: 'Propose a new project',
      description: 'Submit a mathematical foundations project or research programme to OpenMath. New subjects and early-stage proposals are welcome; the site owner reviews proposals.',
      html: shell('New projects are welcome.', 'Help expand OpenMath with a subject that deserves a clear, connected and maintainable mathematical home.', [['Contribute', '/contribute/'], ['Propose a project']],
        `<div class="community-intro-action">${action(proposal, 'Prepare a project proposal on GitHub')}${publicNote}</div>`
        + section('project-types', 'Choose the kind of work', '<div class="community-two-columns"><div><h3>Foundations</h3><p>A systematic account of definitions, conventions, theorems and proofs, with stable references and explicit dependencies.</p></div><div><h3>Research</h3><p>A precise question or programme, with motivations, conjectures, partial results, proof attempts and the obstacles still to resolve.</p></div></div><p>A project may contain both, with their roles clearly separated. Proposals in any mathematical area are welcome.</p>')
        + section('proposal', 'What to include', '<ol class="community-steps"><li><strong>Scope and purpose.</strong> Describe the main mathematical objects, intended readers and why this project would be useful.</li><li><strong>The present state.</strong> Explain which material is established, which arguments are available, and which parts are still questions or plans.</li><li><strong>Materials and references.</strong> Share public drafts, source files, a repository or a concise outline that you are entitled to share.</li><li><strong>Your contribution.</strong> Tell us how you would develop, review or maintain it, or what help the project would need.</li></ol>')
        + section('next', 'From proposal to project', '<p>The site owner reviews the proposal, discusses its scope and available sources, and decides whether to accept it. An accepted project receives a stable project identity and a defined maintenance arrangement before its first public edition.</p><p>Early-stage proposals are welcome. It is enough to explain the mathematical direction and what is currently available.</p>')
        + `<div class="community-actions">${action(proposal, 'Prepare a project proposal on GitHub')}${action(url('/contribute/maintainers/'), 'Apply to help manage a project', true)}</div>`),
    },
    {
      route: '/contribute/maintainers/', title: 'Become a project manager',
      description: 'Apply to help maintain an OpenMath project through mathematical review, editing, logical maps, references or feedback. Managers are appointed by the site owner.',
      html: shell('Help maintain a mathematical project.', 'We welcome people who want to make research clearer, more reliable and easier to build on.', [['Contribute', '/contribute/'], ['Become a project manager']],
        `<div class="community-intro-action">${action(manager, 'Prepare a manager application on GitHub')}${publicNote}</div>`
        + section('contributions', 'There are several ways to contribute', '<ul class="community-steps"><li>Check statements, hypotheses, proofs and references.</li><li>Improve mathematical exposition and consistent notation.</li><li>Maintain logical maps, source links and revision records.</li><li>Respond to feedback and coordinate corrections.</li><li>Help with the website, source organisation or formalisation.</li></ul><p>You may propose a small, well-defined responsibility. A regular and realistic commitment is more useful than an overly broad promise.</p>')
        + section('application', 'Tell us what you would like to do', '<p>Name the project or mathematical subject, describe your relevant experience and interests, and suggest a manageable scope. Public examples of your work are helpful; formal credentials are optional.</p><p>Use your GitHub profile for the initial public conversation. Private contact details and confidential materials are not needed in the application.</p>')
        + section('access', 'Project-specific responsibility', `<p>The site owner reviews applications and grants access separately. Once appointed, a manager can work on feedback, drafts and revisions within the assigned projects, using the management workspace and its <a href="${url('/ai-management/')}">AI management tools</a>.</p><p>You may manage more than one project. New-project acceptance, manager appointments and shared site settings remain with the site owner.</p>`)
        + `<div class="community-actions">${action(manager, 'Prepare a manager application on GitHub')}${action(url('/admin/'), 'Management access', true)}</div>`),
    },
    {
      route: '/admin/', title: 'Management access', noindex: true,
      description: 'Enter the OpenMath management workspace, understand project scopes, or apply to become a project manager.',
      html: shell('Manage OpenMath.', 'One workspace for feedback, source-based revisions and the people responsible for each project.', [['Management access']],
        `<div class="community-intro-action">${managementEntry()}<p class="community-note">Sign in with your own account. Access follows the projects and actions assigned to you.</p></div>`
        + section('roles', 'Two levels of responsibility', '<div class="community-two-columns"><div><h3>Site owner</h3><p>Oversees all projects, reviews new-project proposals, appoints project managers and controls shared site settings.</p></div><div><h3>Project managers</h3><p>Look after their assigned projects: feedback, page content, mathematical sources, logical maps, drafts and revisions.</p></div></div>')
        + section('work', 'From feedback to a traceable revision', '<ol class="community-steps"><li>Open a feedback thread or select the exact page and version to change.</li><li>Prepare a draft against its source and inspect the difference.</li><li>Review the mathematics and any affected dependencies.</li><li>Follow the project’s release policy and retain its fixed historical editions.</li></ol>')
        + section('ai', 'Work with your AI assistant', `<p>The AI entry uses the same account and project scope. Ask your assistant to review materials, organise feedback or prepare source changes; inspect the resulting draft and its evidence.</p><div class="community-actions">${action(url('/ai-management/'), 'AI management guide', true)}${action(url('/contribute/maintainers/'), 'Apply to be a project manager', true)}</div>`)),
    },
    {
      route: '/ai-management/', title: 'AI management',
      description: 'Use your AI assistant with OpenMath management tools to review and revise content within your authorised projects, with exact drafts and review history.',
      html: shell('Bring your AI into the work.', 'Use your own assistant to review and revise the content you are authorised to manage.', [['Management access', '/admin/'], ['AI management']],
        `<div class="community-intro-action">${managementEntry(true)}<p class="community-note">The connection uses your management identity and current project permissions.</p></div>`
        + section('scope', 'Work across your authorised scope', '<div class="community-two-columns"><div><h3>Content and mathematics</h3><p>Review pages, definitions, statements, proofs, references, source files and logical maps. Prepare changes against a precise version and inspect their effects.</p></div><div><h3>Project maintenance</h3><p>Organise feedback, prepare replies, manage drafts, record review findings and help assemble a release. Owner-only decisions remain in the owner’s scope.</p></div></div><p>Available actions are listed by the authenticated management connection. The assistant uses the same permissions and release rules as its manager.</p>')
        + section('connect', 'Connect and start a task', '<ol class="community-steps"><li><strong>Open the AI management entry.</strong> Sign in and check the projects assigned to you.</li><li><strong>Connect your assistant.</strong> Use the management workspace’s authenticated MCP connection in your AI client.</li><li><strong>Inspect your scope.</strong> Ask the assistant to list the projects and operations it can access before choosing a task.</li><li><strong>Review the result.</strong> Keep the changed sources, exact version, differences and review findings together, then follow the project’s publication policy.</li></ol>')
        + section('example', 'A useful first request', `<pre class="community-prompt"><code>Show my current OpenMath management scope.
Review the selected page and its mathematical sources.
Prepare a draft of the changes you recommend, preserving
permanent IDs, hypotheses and exact references.
Show the diff, supporting evidence and affected dependencies.</code></pre>`)
        + section('evidence', 'Keep the evidence with the change', '<p>AI-assisted review records the actual assistant and the scope of its work. Mathematical status, review findings and publication state remain separate. The source version and its dependencies stay attached to the proposed change.</p><p>Feedback, uploaded notes and source text are material to examine. They do not change the manager’s permissions or the task’s instructions.</p>')
        + `<div class="community-actions">${action(url('/ai-and-math/'), 'Download the research agents', true)}${action(url('/contribute/maintainers/'), 'Become a project manager', true)}</div>`),
    },
  ];
  return pages;
}
