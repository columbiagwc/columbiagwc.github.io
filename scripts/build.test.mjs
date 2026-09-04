import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, writeFile, rm, access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build.mjs';
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('content-driven pages, gallery, links, dates, and validation', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(),'gwc-test-'));
  const previousDate = process.env.SITE_COMMIT_DATE;
  t.after(async()=>{await rm(root,{recursive:true,force:true});if(previousDate===undefined)delete process.env.SITE_COMMIT_DATE;else process.env.SITE_COMMIT_DATE=previousDate;});
  for (const name of ['content','public']) await cp(path.join(project,name),path.join(root,name),{recursive:true});
  await writeFile(path.join(root,'CNAME'),'example.org\n');
  process.env.SITE_COMMIT_DATE='2026-09-03T12:00:00-04:00';
  const edit = async(name,fn)=>{const file=path.join(root,'content',name+'.json');const value=JSON.parse(await readFile(file,'utf8'));fn(value);await writeFile(file,JSON.stringify(value));};
  const board=JSON.parse(await readFile(path.join(root,'content/board.json'),'utf8'));
  await edit('home',d=>{d.heading='A PR changed this <heading>';});
  await edit('events',d=>{
    d.upcoming=[{id:'later',title:'Later event',date:'2026-10-20',description:'Later'}, {id:'first',title:'First event',date:'2026-10-01',description:'Meet & code',location:'Campus',link:{label:'Register',href:'https://example.com/register'}}];
    d.past=[{id:'gallery',title:'A past event',date:'2025-10-01',description:'Community memories',photos:[{src:board.members[0].image,alt:'Event attendees',caption:'A caption <with> text'}]}];
  });
  const out=await build({root});
  const home=await readFile(path.join(out,'index.html'),'utf8');
  assert.match(home,/A PR changed this &lt;heading&gt;/);
  assert.match(home,/Last updated <time datetime="2026-09-03T12:00:00-04:00">September 3, 2026/);
  assert.ok(home.indexOf('First event')<home.indexOf('Later event'));
  assert.ok(home.indexOf('id="upcoming-events"')<home.indexOf('class="mission'));
  assert.match(home,/href="#upcoming-events"/);
  assert.match(home,/href="https:\/\/docs.google.com\/forms\/d\/e\/1FAIpQLScYCgVK5HCoI1dmgLjPeniAA29OI0rCodhOnK7_-VqoZvYPIw\/viewform\?usp=sharing&amp;ouid=112523625594007399092"/);
  assert.ok(!home.includes("columbiagwc+subscribe"));
  const past=await readFile(path.join(out,'past-events/index.html'),'utf8');
  assert.match(past,/Event attendees/);assert.match(past,/A caption &lt;with&gt; text/);
  const routes=['index.html','programs/index.html','committees/index.html','board/index.html','past-events/index.html','blank/index.html','blank-1/index.html','blank-2/index.html'];
  for(const route of routes){
    const html=await readFile(path.join(out,route),'utf8');
    for(const [,raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
      if (/^(https:|mailto:)/.test(raw))continue;
      const [href,anchor]=raw.split('#');
      let destination=path.resolve(out,path.dirname(route),href||path.basename(route));
      if(href.endsWith('/'))destination=path.join(destination,'index.html');
      await access(destination);
      if(anchor){const target=await readFile(destination,'utf8');assert.ok(target.includes(`id="${anchor}"`),`${route}: missing #${anchor}`);}
    }
    assert.ok(!html.includes('undefined'),`${route}: undefined content`);
  }
  assert.equal((await readFile(path.join(out,'CNAME'),'utf8')).trim(),'example.org');
  await access(path.join(out,'.nojekyll'));
  await edit('events',d=>{d.upcoming[0].date='2026-02-30';});
  await assert.rejects(build({root}),/Invalid event date/);
  await edit('events',d=>{d.upcoming[0].date='2026-10-20';d.upcoming[0].link={label:'Unsafe',href:'javascript:alert(1)'};});
  await assert.rejects(build({root}),/use an HTTPS/);
  await edit('events',d=>{delete d.upcoming[0].link;d.past[0].photos[0].src='assets/missing.jpg';});
  await assert.rejects(build({root}),/missing public\/assets\/missing.jpg/);
});
