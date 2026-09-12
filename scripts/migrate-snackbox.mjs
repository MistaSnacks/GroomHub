// Generate reviewable CMS documents from current MDX. No network writes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkGfm from 'remark-gfm';

const output = path.resolve(process.argv[2]);
fs.mkdirSync(output, {recursive:true});
const parser = unified().use(remarkParse).use(remarkMdx).use(remarkGfm);
const topicSource = fs.readFileSync('src/lib/grooming-guides.ts','utf8');
const topics = [...topicSource.matchAll(/id: "([^"]+)"[\s\S]*?slugs: \[([\s\S]*?)\]/g)];
const assets = new Map();
let key = 0;
const next = () => `k${++key}`;
function asset(src) {
  if (!src.startsWith('/')) throw Error('Unexpected external migration image: '+src);
  const pathname = src.split('?')[0];
  const file = path.join('public',pathname);
  const bytes = fs.readFileSync(file);
  assets.set(src, {src,url:'https://groomlocal.com'+src,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
  return {_migrationImage:src};
}
function spans(nodes, marks=[], defs=[]) {
  return nodes.flatMap(n=>{
    if (n.type==='text' || n.type==='inlineCode') return [{_type:'span',_key:next(),text:n.value,marks:n.type==='inlineCode'?[...marks,'code']:marks}];
    if (n.type==='break') return [{_type:'span',_key:next(),text:'\n',marks}];
    if (['strong','emphasis','delete'].includes(n.type)) return spans(n.children,[...marks,{strong:'strong',emphasis:'em',delete:'strike'}[n.type]],defs);
    if (n.type==='link') {const id=next();defs.push({_key:id,_type:'link',href:n.url});return spans(n.children,[...marks,id],defs);}
    throw Error('Unsupported inline node '+n.type);
  });
}
function blocks(nodes, level=1) {
  return nodes.flatMap(n=>{
    if (['paragraph','heading'].includes(n.type)) {const markDefs=[];return [{_type:'block',_key:next(),style:n.type==='heading'?`h${n.depth}`:'normal',markDefs,children:spans(n.children,[],markDefs)}];}
    if (n.type==='thematicBreak') return [{_type:'rule',_key:next()}];
    if (n.type==='blockquote') return blocks(n.children).map(b=>({...b,style:'blockquote'}));
    if (n.type==='list') return n.children.flatMap(item=>item.children.flatMap(child=>child.type==='list'?blocks([child],level+1):blocks([child]).map(b=>({...b,listItem:n.ordered?'number':'bullet',level}))));
    throw Error('Unsupported block '+n.type);
  });
}
const documents=[];
for (const filename of fs.readdirSync('src/content/blog').filter(n=>n.endsWith('.mdx'))) {
  key=0;
  const {data,content}=matter(fs.readFileSync(path.join('src/content/blog',filename),'utf8'));
  const tree=parser.parse(content);
  const body=[],sections=[];
  const cell = c => c.children.length ? content.slice(c.children[0].position.start.offset,c.children.at(-1).position.end.offset).trim() : "";
  function addText(nodes) {const converted=blocks(nodes); if(!sections.length) body.push(...converted);else {let last=sections.at(-1);if(last.kind!=='text'){last={kind:'text',body:[]};sections.push(last);}last.body.push(...converted);}}
  for(const n of tree.children) {
    if(n.type==='table') sections.push({kind:'table',table:{headings:n.children[0].children.map(cell),rows:n.children.slice(1).map(r=>({cells:r.children.map(cell)}))}});
    else if(n.type==='mdxJsxFlowElement' && n.name==='Callout') sections.push({kind:'callout',body:blocks(n.children)});
    else if(n.type==='paragraph' && n.children.some(c=>c.type==='image')) {
      if(n.children.length!==1) throw Error('Mixed inline image needs explicit review: '+filename);
      const image=n.children[0];sections.push({kind:'illustration',image:asset(image.url),imageAlt:image.alt||''});
    } else addText([n]);
  }
  const slug=data.slug||filename.replace(/\.mdx$/,'');
  const topic=topics.find(t=>t[2].includes('"'+slug+'"'))?.[1];
  if(!topic)throw Error('No topic for '+slug);
  const doc={id:'blog-'+slug,type:'blogPost',data:{title:data.title,slug,excerpt:data.excerpt,category:data.category,author:{_ref:'author-'+data.author.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')},authorBio:data.author.bio,topic:{_ref:'topic-'+topic},date:data.date,dateModified:data.dateModified||data.date,readTime:data.readTime,heroImage:asset(data.image),heroAlt:data.title,tags:data.tags||[],body,sections,artworkReview:{status:'pending'}}};
  fs.writeFileSync(path.join(output,slug+'.json'),JSON.stringify(doc,null,2));
  documents.push({id:doc.id,slug,file:slug+'.json',sections:sections.length});
}
fs.writeFileSync(path.join(output,'assets.json'),JSON.stringify([...assets.values()],null,2));
fs.writeFileSync(path.join(output,'documents.json'),JSON.stringify(documents,null,2));
console.log(JSON.stringify({documents:documents.length,assets:assets.size,output}));
