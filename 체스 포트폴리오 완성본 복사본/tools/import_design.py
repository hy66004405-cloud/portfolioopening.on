from pathlib import Path
import unicodedata, json, shutil, subprocess, re, hashlib
root=Path(__file__).resolve().parents[1]
norm=lambda x:unicodedata.normalize('NFC',str(x))
source=next(p for p in Path.home().joinpath('Documents').iterdir() if norm(p.name)=='대외활동')
image_ext={'.png','.jpg','.jpeg','.webp','.gif','.tif','.tiff','.bmp','.heic','.avif'}
files=sorted([p for p in source.rglob('*') if p.is_file() and p.suffix.lower() in image_ext],key=lambda p:norm(p.relative_to(source)))
projects={};manifest=[]
for file in files:
 rel=norm(file.relative_to(source));parts=Path(rel).parts
 group=parts[0] if len(parts)>1 else file.stem
 group=norm(group)
 section=' / '.join(parts[1:-1]) if len(parts)>2 else ''
 name=norm(file.stem);uid=hashlib.sha256(rel.encode()).hexdigest()[:12]
 original=root/'assets/design/originals'/rel;original.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(file,original)
 preview=root/'assets/design/previews'/f'{uid}.jpg';preview.parent.mkdir(parents=True,exist_ok=True)
 subprocess.run(['sips','-s','format','jpeg','-s','formatOptions','88','-Z','2560',str(original),'--out',str(preview)],check=True,capture_output=True)
 dimensions=subprocess.run(['sips','-g','pixelWidth','-g','pixelHeight',str(preview)],capture_output=True,text=True,check=True).stdout
 width=int(re.search(r'pixelWidth: (\d+)',dimensions)[1]);height=int(re.search(r'pixelHeight: (\d+)',dimensions)[1])
 item={'id':uid,'title':name,'section':section,'sourceRelative':rel,'image':str(preview.relative_to(root)),'original':str(original.relative_to(root)),'width':width,'height':height,'completionRank':name.count('완성'),'proposalRank':name.count('제안'),'role':'support' if '제안' in name else 'primary','parentId':None}
 projects.setdefault(group,[]).append(item);manifest.append(item)
# Preserve hierarchy within each leaf folder. Proposals follow their closest primary.
def tokens(title):return set(re.findall(r'[가-힣A-Za-z]+',re.sub(r'완성본?|제안된?|\d+',' ',title)))
result=[]
for index,(title,items) in enumerate(projects.items()):
 sections={}
 for item in items:sections.setdefault(item['section'],[]).append(item)
 slides=[]
 for section,entries in sections.items():
  primary=sorted([x for x in entries if x['role']=='primary'],key=lambda x:(-x['completionRank'],x['title']))
  support=sorted([x for x in entries if x['role']=='support'],key=lambda x:(x['proposalRank'],x['title']))
  if not primary:slides.extend(support);continue
  attachments={x['id']:[] for x in primary}
  for item in support:
   parent=max(primary,key=lambda x:(len(tokens(x['title'])&tokens(item['title'])),x['completionRank']))
   item['parentId']=parent['id'];attachments[parent['id']].append(item)
  for item in primary:slides.append(item);slides.extend(attachments[item['id']])
 result.append({'id':f'project-{index+1:02d}','title':title,'slides':slides,'primaryCount':sum(x['role']=='primary' for x in slides)})
display_order=['점, 선, 면', '원으로 표현하는 디자인 원리', '드로잉', '균사체 패턴화 포스터 프로젝트', '과거와 현재의 만남', "영화 '노이즈' 포스터 디자인"]
result.sort(key=lambda p:display_order.index(p['title']) if p['title'] in display_order else len(display_order))
(root/'design-projects.js').write_text('export const designProjects = '+json.dumps(result,ensure_ascii=False,indent=2)+';\n')
(root/'design-source-manifest.json').write_text(json.dumps({'sourceFolder':str(source),'totalImages':len(files),'projects':result},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'images':len(files),'projects':len(result),'groups':[{ 'title':p['title'],'images':len(p['slides'])} for p in result]},ensure_ascii=False))
