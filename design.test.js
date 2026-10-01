import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync,readFileSync } from 'node:fs';
import { designProjects } from '../design-projects.js';
test('Every local source image has an original and a preview in the exhibit',()=>{
 const slides=designProjects.flatMap(p=>p.slides);
 assert.equal(slides.length,25);assert.equal(new Set(slides.map(s=>s.sourceRelative)).size,25);
 for(const s of slides){assert.ok(existsSync(new URL('../'+s.original,import.meta.url)));assert.ok(existsSync(new URL('../'+s.image,import.meta.url)));assert.ok(s.width>0&&s.height>0)}
});
test('Finished posters lead their proposals; proposals stay within the same folder',()=>{
 for(const p of designProjects){
  for(const s of p.slides){
   if(s.parentId){const parent=p.slides.find(x=>x.id===s.parentId);assert.ok(parent);assert.equal(parent.role,'primary');assert.equal(parent.section,s.section);assert.ok(p.slides.indexOf(parent)<p.slides.indexOf(s))}
  }
 }
 for(const p of designProjects.filter(p=>p.title.includes('포스터'))){assert.ok(p.slides[0].completionRank>0);assert.ok(p.slides.slice(1).every(s=>s.role==='support'&&s.parentId===p.slides[0].id))}
});
test('Nested design-principle folders remain separate peer categories',()=>{
 const p=designProjects.find(p=>p.title==='원으로 표현하는 디자인 원리');
 assert.deepEqual([...new Set(p.slides.map(s=>s.section))],['균형','리듬','변화','비례','통일']);
 assert.ok(p.slides.every(s=>s.role==='primary'&&s.parentId===null&&s.completionRank===0));
});
