import { createElement, Fragment, type ElementType, type ReactNode } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { mdxComponents } from "./mdx-components";
import { imageUrl, safeContentHref, type PortableBlock, type PortableSpan, type CmsSection } from "@/lib/cms/content";

const wrap = (tag: string, children?: ReactNode, props: Record<string, unknown> = {}) =>
  createElement((mdxComponents[tag] || tag) as ElementType, props, children);

function spanContent(span: PortableSpan, block: PortableBlock): ReactNode {
  let value: ReactNode = span.text;
  for (const mark of span.marks || []) {
    if (["strong", "em", "code", "strike"].includes(mark)) value = wrap(mark === "strike" ? "del" : mark, value);
    else {
      const href = safeContentHref(block.markDefs?.find(def => def._key === mark)?.href);
      if (href) value = wrap("a", value, { href });
    }
  }
  return <Fragment key={span._key}>{value}</Fragment>;
}

function textBlock(block: PortableBlock) {
  const content = block.children?.map(span=>spanContent(span,block));
  if (block._type === "rule") return wrap("hr");
  const tag = ["h2", "h3", "h4", "blockquote"].includes(block.style || "") ? block.style! : "p";
  return wrap(tag, content);
}

export function PortableContent({ blocks = [] }: { blocks?: PortableBlock[] }) {
  const output: ReactNode[] = [];
  let index = 0;
  function list(): ReactNode {
    const level = blocks[index].level || 1;
    const style = blocks[index].listItem;
    const entries: ReactNode[] = [];
    while (index < blocks.length && blocks[index].listItem === style && (blocks[index].level || 1) === level) {
      const block = blocks[index++];
      const children: ReactNode[] = [<Fragment key="text">{block.children?.map(span=>spanContent(span,block))}</Fragment>];
      while (index < blocks.length && blocks[index].listItem && (blocks[index].level || 1) > level) children.push(<Fragment key={index}>{list()}</Fragment>);
      entries.push(wrap("li", children, {key:block._key || index}));
    }
    return wrap(style === "number" ? "ol" : "ul", entries);
  }
  while (index < blocks.length) {
    const key = blocks[index]._key || index;
    const content = blocks[index].listItem ? list() : textBlock(blocks[index++]);
    output.push(<Fragment key={key}>{content}</Fragment>);
  }
  return <>{output}</>;
}

interface InlineNode { type: string; value?: string; url?: string; children?: InlineNode[] }
const cellParser = unified().use(remarkParse);
function cell(value: string) {
  function render(node: InlineNode, key: number): ReactNode {
    const children = node.children?.map(render);
    if (node.type === "text" || node.type === "html") return node.value;
    if (node.type === "link") { const href = safeContentHref(node.url); return href ? wrap("a", children, {href,key}) : <Fragment key={key}>{children}</Fragment>; }
    const tag = ({strong:"strong",emphasis:"em",inlineCode:"code",delete:"del"} as Record<string,string>)[node.type];
    return tag ? wrap(tag,node.value || children,{key}) : <Fragment key={key}>{children}</Fragment>;
  }
  // Markdown is parsed as data only; HTML/MDX is never executed.
  return render(cellParser.parse(value) as InlineNode,0);
}

export function CmsSections({ sections = [] }: { sections?: CmsSection[] }) {
  return <>{sections.map((section,index)=><Fragment key={index}>
    {section.heading && wrap("h2",section.heading)}
    {section.kind === "callout" ? wrap("Callout",<PortableContent blocks={section.body} />) : <PortableContent blocks={section.body} />}
    {section.image && imageUrl(section.image) && wrap("img",undefined,{src:imageUrl(section.image),alt:section.imageAlt || section.image.alt || ""})}
    {section.caption && <p className="text-sm text-center text-text-muted">{section.caption}</p>}
    {section.table && wrap("table",<>
      {wrap("thead",wrap("tr",section.table.headings?.map((heading,i)=>wrap("th",cell(heading),{key:i}))))}
      {wrap("tbody",section.table.rows?.map((row,i)=>wrap("tr",row.cells?.map((value,j)=>wrap("td",cell(value),{key:j})),{key:i})))}
    </>)}
  </Fragment>)}</>;
}
