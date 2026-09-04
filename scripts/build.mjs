import { readFile, writeFile, mkdir, cp, rm, access } from 'node:fs/promises';
import path from 'node:path';
import { committeeIcons, committeeIcon } from './icons.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paragraphs = text => text.split('\n\n').map(p => `<p>${escape(p)}</p>`).join('');

export async function build({ root = project, output = path.join(root, 'dist') } = {}) {
  const data = {};
  for (const name of ['site', 'home', 'programs', 'committees', 'board', 'events', 'buttons']) {
    try { data[name] = JSON.parse(await readFile(path.join(root, 'content', `${name}.json`), 'utf8')); }
    catch (error) { throw new Error(`Cannot read content/${name}.json: ${error.message}`); }
  }
  const { site, home, programs, committees, board, events, buttons } = data;
  function requireText(value, location) {
    if (typeof value !== 'string' || !value.trim()) throw new Error(`${location} must be nonempty text`);
  }
  function requireList(value, location) {
    if (!Array.isArray(value) || !value.length) throw new Error(`${location} must be a nonempty list`);
  }
  // Fail PR checks on unsafe links or missing local images before publishing.
  async function validate(value, location = 'content') {
    if (Array.isArray(value)) { for (const [i,v] of value.entries()) await validate(v, `${location}[${i}]`); return; }
    if (!value || typeof value !== 'object') return;
    for (const [key, v] of Object.entries(value)) {
      const label = `${location}.${key}`;
      if (['href','url','applicationUrl'].includes(key)) {
        requireText(v, label);
        if (!/^(https:\/\/|mailto:|[a-z0-9][a-z0-9/-]*(?:#[a-z0-9-]+)?$)/i.test(v)) throw new Error(`${label}: use an HTTPS, mailto, or relative link`);
        if (v.startsWith('https://')) new URL(v);
      }
      if (['image','logo','heroImage','art','src'].includes(key)) {
        requireText(v, label);
        if (!/^assets\/[a-zA-Z0-9_.~/-]+$/.test(v) || v.includes('..')) throw new Error(`${label}: use a file inside public/assets`);
        try { await access(path.join(root, 'public', v)); } catch { throw new Error(`${label}: missing public/${v}`); }
      }
      await validate(v, label);
    }
  }
  await validate(data);
  for (const name of ['getInvolved','newsletter','teachingApplication','committeeApplication','studentApplication']) {
    const config=buttons[name];
    if (!config) throw new Error(`buttons.${name} is required`);
    for (const key of ['label','href']) requireText(config[key], `buttons.${name}.${key}`);
    for (const key of ['disabled','newTab']) if (config[key] !== undefined && typeof config[key] !== 'boolean') throw new Error(`buttons.${name}.${key} must be true or false`);
    if (config.disabled) requireText(config.closedMessage, `buttons.${name}.closedMessage`);
  }
  for (const member of board.members) if (member.visible !== undefined && typeof member.visible !== 'boolean') throw new Error('board member visible must be true or false');
  for (const [name, page] of Object.entries({home, programs, committees, board})) requireText(page.title, `${name}.title`);
  requireList(site.navigation, 'site.navigation');
  requireList(home.missions, 'home.missions');
  requireList(programs.courses, 'programs.courses');
  requireList(committees.items, 'committees.items');
  requireList(board.members, 'board.members');
  for (const [i, member] of board.members.entries()) for (const key of ['name','role','bio','image']) requireText(member[key], `board.members[${i}].${key}`);
  const ids = new Set();
  for (const item of committees.items) {
    if (!Object.hasOwn(committeeIcons,item.icon)) throw new Error(`Unknown committee icon: ${item.icon}`);
    requireText(item.description, `committees.${item.id}.description`);
    if (!/^[a-z][a-z0-9-]*$/.test(item.id) || ids.has(item.id)) throw new Error('Committee IDs must be unique lowercase slugs');
    ids.add(item.id);
  }
  if (!['open', 'closed', 'archived'].includes(programs.term.status)) throw new Error('programs.term.status must be open, closed, or archived');
  const eventIds = new Set();
  for (const bucket of ['upcoming', 'past']) {
    if (!Array.isArray(events[bucket])) throw new Error(`events.${bucket} must be a list`);
    for (const event of events[bucket]) {
      for (const key of ['id','title','date','description']) requireText(event[key], `events.${bucket}.${key}`);
      if (!/^[a-z][a-z0-9-]*$/.test(event.id) || eventIds.has(event.id)) throw new Error('Event IDs must be unique lowercase slugs');
      eventIds.add(event.id);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date) || !Number.isFinite(Date.parse(event.date)) || new Date(event.date).toISOString().slice(0,10)!==event.date) throw new Error(`Invalid event date: ${event.date}`);
      if (event.photos !== undefined && !Array.isArray(event.photos)) throw new Error('Event photos must be a list');
      for (const photo of event.photos ?? []) for (const key of ['src','alt']) requireText(photo[key], `events.${event.id}.photos.${key}`);
      if (event.link) { requireText(event.link.label, 'event.link.label'); requireText(event.link.href, 'event.link.href'); }
    }
  }
  let commitDate = process.env.SITE_COMMIT_DATE;
  if (!commitDate) {
    try { commitDate = execFileSync('git', ['log','-1','--format=%cI'], {cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim(); }
    catch { commitDate = new Date().toISOString(); }
  }
  if (!Number.isFinite(Date.parse(commitDate))) throw new Error('Invalid SITE_COMMIT_DATE');
  const displayDate = new Intl.DateTimeFormat('en-US', {dateStyle:'long',timeZone:'America/New_York'}).format(new Date(commitDate));
  const eventDate = date => new Intl.DateTimeFormat('en-US', {dateStyle:'long',timeZone:'UTC'}).format(new Date(date));
  function eventCards(items, helpers, heading = 'h3') {
    const {img,link} = helpers;
    return `<div class="event-list">${items.map(event => `<article class="event" id="${escape(event.id)}"><${heading}>${escape(event.title)}</${heading}><p class="event-meta"><time datetime="${escape(event.date)}">${escape(eventDate(event.date))}</time>${event.time ? ` · ${escape(event.time)}` : ''}${event.location ? `<br>${escape(event.location)}` : ''}</p>${event.image ? img(event.image,event.imageAlt ?? event.title,'event-cover') : ''}${paragraphs(event.description)}${event.link ? link(event.link.label,event.link.href,'button') : ''}${event.photos?.length ? `<div class="photo-grid">${event.photos.map(photo=>`<figure><a href="${escape(helpers.url(photo.src))}">${img(photo.src,photo.alt)}</a>${photo.caption?`<figcaption>${escape(photo.caption)}</figcaption>`:''}</figure>`).join('')}</div>` : ''}</article>`).join('')}</div>`;
  }
  // Do not remove the previous output until the content has passed validation.
  await rm(output, {recursive: true, force: true});
  await mkdir(output, {recursive: true});
  await cp(path.join(root, 'public'), output, {recursive: true});
  try { await cp(path.join(root, 'CNAME'), path.join(output, 'CNAME')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  await writeFile(path.join(output, '.nojekyll'), '');

  function render(route, title, body) {
    const base = route ? '../' : './';
    const url = href => /^(https:|mailto:|#)/.test(href) ? href : base + href;
    const opensNewTab = (href, requested = false) => requested || /^(https:|mailto:)/.test(href);
    const tabAttributes = href => opensNewTab(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
    const link = (label, href, cls = '', newTab = false) => {
      newTab = opensNewTab(href, newTab);
      return `<a${cls ? ` class="${cls}"` : ''} href="${escape(url(href))}"${newTab ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escape(label)}${newTab ? '<span class="sr-only"> (opens in a new tab)</span>' : ''}</a>`;
    };
    const button = (name, cls = 'button') => {
      const config = buttons[name];
      if (config.disabled) return `<aside class="application-closed"><p>${escape(config.closedMessage)}</p>${link(buttons.newsletter.label,buttons.newsletter.href,'button',buttons.newsletter.newTab)}</aside>`;
      return link(config.label,config.href,cls,config.newTab);
    };
    const img = (src, alt, cls = '', eager = false) => `<img src="${escape(base + src)}" alt="${escape(alt)}" class="${cls}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)} | GWC Columbia</title><meta name="description" content="${escape(site.description)}"><link rel="canonical" href="${escape(site.url + '/' + route)}"><link rel="stylesheet" href="${base}style.css"><script src="${base}site.js" defer></script></head><body class="page-${escape(route.replaceAll('/','') || 'home')}">
<a class="skip" href="#main">Skip to content</a>
<header><div class="nav-wrap"><a class="brand" href="${base}" aria-label="${escape(site.name)} — Home">${img(site.logo, site.name, '', true)}</a><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav" hidden>Menu <span aria-hidden="true">☰</span></button><nav id="main-nav" aria-label="Main navigation">${site.navigation.map(n => `<a href="${escape(url(n.href))}"${tabAttributes(n.href)}${n.href===route ? ' aria-current="page"' : ''}>${escape(n.label)}</a>`).join('')}${button('getInvolved')}</nav></div></header>
<main id="main">${body({img,link,url,button,tabAttributes})}</main>
<footer><div class="footer-grid"><section><h2>${escape(site.footer.contactTitle)}</h2>${link(site.email, `mailto:${site.email}`)}<h2>${escape(site.footer.socialTitle)}</h2><div class="socials">${site.socials.map(s => `<a href="${escape(s.href)}"${tabAttributes(s.href)} aria-label="${escape(s.label)}">${img(s.image,s.label)}</a>`).join('')}</div></section><section class="newsletter"><h2>${escape(site.newsletter.title)}</h2><p>${escape(site.newsletter.description)}</p>${button('newsletter','button outline')}</section></div><div class="footer-bottom"><p class="copyright">© ${escape(site.footer.copyright)}</p><p class="updated">${escape(site.footer.updatedLabel)} <time datetime="${escape(commitDate)}">${escape(displayDate)}</time></p></div></footer></body></html>`;
    return html;
  }
  const pages = {
    '': render('', home.title, ({img,link,url,button}) => `
      <section class="home-hero"><h1 class="sr-only">${escape(home.title)}</h1>
        ${img(home.heroImage,home.heroAlt,'hero-art',true)}
        <a class="scroll-cue" href="#upcoming-events"><span>${escape(home.scrollLabel)}</span><span class="scroll-glyph" aria-hidden="true">↓</span></a>
      </section>
      <section id="upcoming-events" class="events-section"><div class="section">
        <div class="section-heading"><h2>${escape(events.upcomingTitle)}</h2>${link(events.pageLinkLabel,'events/')}</div>
        ${events.upcoming.length ? eventCards([...events.upcoming].sort((a,b)=>a.date.localeCompare(b.date)),{img,link,url}) : `<div class="empty-state"><h3>${escape(events.upcomingEmpty.title)}</h3><p>${escape(events.upcomingEmpty.description)}</p>${button('newsletter')}</div>`}
      </div></section>
      <section class="mission section">${img(home.image,home.imageAlt,'mission-art')}
        <div class="mission-copy"><h2>${escape(home.heading)}</h2><p>${escape(home.intro)}</p>
          <ul class="missions">${home.missions.map(m => `<li>${escape(m.text)}</li>`).join('')}</ul><p>${escape(home.closing)}</p>
        </div>
      </section>`),
    'programs/': render('programs/',programs.title,({img,link,button}) => `
      <section class="program-intro"><div class="intro-inner">${img(programs.image,'','intro-art',true)}
        <div class="intro-copy"><h1>${escape(programs.heading)}</h1>${programs.intro.map(p=>`<p>${escape(p)}</p>`).join('')}
          <div class="actions">${link(programs.studentLabel,'#classes','button')}${link(programs.teacherLabel,'#teaching','button')}</div>
        </div>
      </div></section>
      <section id="classes" class="classes"><div class="section term-layout"><h2>${escape(programs.term.title)}</h2><div>
        ${programs.term.status!=='open'?`<p class="notice">${escape(programs.term.notice)}</p>`:''}
        <h3>${escape(programs.term.heading)}</h3><p>${escape(programs.term.description)}</p>
        <ul>${programs.term.schedule.map(s=>`<li>${escape(s)}</li>`).join('')}</ul><p>${escape(programs.term.eligibility)}</p>
        <p><strong>${escape(programs.term.deadlineLabel)}:</strong> ${escape(programs.term.deadline)}</p><p>${escape(programs.term.attendance)}</p>
      </div></div></section>
      <section class="courses"><div class="section course-grid">${programs.courses.map((c,i)=>`<article class="course"><span class="number" aria-hidden="true">${i+1}</span><h3>${escape(c.title)}</h3><p>${escape(c.description)}</p>${programs.term.status==='open' ? button('studentApplication') : ''}</article>`).join('')}</div></section>
      <section id="teaching" class="teaching"><div class="teaching-picture"><h2>${escape(programs.teaching.title)}</h2>${img(programs.teaching.image,programs.teaching.imageAlt,'section-photo')}</div>
        <div class="teaching-copy"><h3>${escape(programs.teaching.heading)}</h3><p>${escape(programs.teaching.description)}</p>${button('teachingApplication')}</div>
      </section>`),
    'committees/': render('committees/',committees.title,({img,link,url,button,tabAttributes})=>`
      <section class="committees-hero">${img(committees.image,'','committees-background',true)}<div class="committees-intro"><h1>${escape(committees.title)}</h1><p>${escape(committees.intro)}</p>${button('committeeApplication')}</div></section>
      <nav class="committee-nav" aria-label="Committees"><div class="section">${committees.items.map(c=>`<a class="committee-link" href="${escape(url(c.href||'#'+c.id))}"${tabAttributes(c.href||'#'+c.id)}>${committeeIcon(c.icon)}<span>${escape(c.title)}</span></a>`).join('')}</div></nav>
      ${committees.items.filter(c=>c.id!=='teaching').map((c,i)=>`<section id="${escape(c.id)}" class="committee-band ${i%2?'alternate':''}"><div class="committee section"><div class="committee-copy"><h2>${escape(c.title)}</h2><p>${escape(c.description)}</p></div><div class="committee-gallery">${img(c.image,c.title+' committee','gallery-main')}<div class="gallery-thumbs"><a href="${escape(url(c.image))}" aria-current="true">${img(c.image,c.title+' committee photo')}</a>${c.art?`<a href="${escape(url(c.art))}">${img(c.art,c.title+' committee highlight')}</a>`:''}</div></div></div></section>`).join('')}`),
    'events/': render('events/',events.title,helpers=>`
      <section class="floral-heading"><h1>${escape(events.title)}</h1><p>${escape(events.intro)}</p></section>
      <section id="upcoming-events" class="section event-section"><h2>${escape(events.upcomingTitle)}</h2>
        ${events.upcoming.length ? eventCards([...events.upcoming].sort((a,b)=>a.date.localeCompare(b.date)),helpers) : `<div class="empty-state"><h3>${escape(events.upcomingEmpty.title)}</h3><p>${escape(events.upcomingEmpty.description)}</p>${helpers.button('newsletter')}</div>`}
      </section>
      <section id="past-events" class="section event-section"><h2>${escape(events.pastTitle)}</h2><p>${escape(events.pastIntro)}</p>
        ${events.past.length ? eventCards([...events.past].sort((a,b)=>b.date.localeCompare(a.date)),helpers) : `<div class="empty-state"><h3>${escape(events.pastEmpty.title)}</h3><p>${escape(events.pastEmpty.description)}</p></div>`}
      </section>`),
    'board/': render('board/',board.title,({img,tabAttributes})=>`
      <section class="floral-heading"><h1>${escape(board.title)}</h1><span class="heading-rule" aria-hidden="true"></span><p>${escape(board.subtitle)}</p></section>
      <section class="board-grid section" aria-label="Board members">${board.members.filter(m=>m.visible!==false).map(m=>`
        <article class="member">${img(m.image,m.name,'portrait')}<div class="member-copy"><p class="member-role">${escape(m.role)}</p><h2>${escape(m.name)}</h2><div class="member-bio">${paragraphs(m.bio)}</div>
        <div class="member-links">${site.profileSocials.map(s=>`<a href="${escape(s.href)}"${tabAttributes(s.href)} aria-label="${escape(site.name+' on '+s.label)}">${img(s.image,s.label)}</a>`).join('')}</div></div></article>`).join('')}
      </section>`)
  };
  for (const [route,html] of Object.entries(pages)) {
    await mkdir(path.join(output,route),{recursive:true});
    await writeFile(path.join(output,route,'index.html'),html);
  }
  const aliases = {'blank':'programs/','blank-1':'committees/','blank-2':'board/','past-events':'events/'};
  for(const [alias,target] of Object.entries(aliases)) {
    await mkdir(path.join(output,alias),{recursive:true});
    await writeFile(path.join(output,alias,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=../${target}"><title>Page moved</title><link rel="canonical" href="${escape(site.url+'/'+target)}"></head><body><a href="../${target}">Continue to ${escape(target.replace('/',''))}</a></body></html>`);
  }
  // Absolute homepage link works even when GitHub serves this at a nested missing URL.
  await writeFile(path.join(output,'404.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(site.notFound.title)}</title></head><body><h1>${escape(site.notFound.title)}</h1><p>${escape(site.notFound.description)}</p><a href="${escape(site.url)}">${escape(site.notFound.label)}</a></body></html>`);
  // Check the actual edited content too, not just the test fixtures.
  const generatedRoutes = [...Object.keys(pages), ...Object.keys(aliases).map(alias => alias + '/')];
  for (const route of generatedRoutes) {
    const file = path.join(output, route, 'index.html');
    const html = await readFile(file, 'utf8');
    const documentIds = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    if (new Set(documentIds).size !== documentIds.length) throw new Error(`${route || '/'}: duplicate HTML IDs`);
    for (const [, reference] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(https:|mailto:)/.test(reference)) continue;
      const [relative, anchor] = reference.split('#');
      let target = relative ? path.resolve(path.dirname(file), relative) : file;
      if (relative.endsWith('/')) target = path.join(target, 'index.html');
      if (!target.startsWith(output + path.sep)) throw new Error(`Link outside site: ${reference}`);
      try { await access(target); } catch { throw new Error(`${route || '/'}: broken local link ${reference}`); }
      if (anchor && !(await readFile(target, 'utf8')).includes(`id="${anchor}"`)) throw new Error(`${route || '/'}: missing anchor ${reference}`);
    }
  }
  console.log(`Built ${Object.keys(pages).length} pages, ${Object.keys(aliases).length} redirects, and 404 into ${output}`);
  return output;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
