import { Fragment } from "react";
import { stegaClean } from "@/lib/cms/sdk";

/** Preserve highlighted phrases and intentional line breaks while copy remains editable. */
export function MarketingHeading({text,emphasis,className="text-brand-secondary",breakBefore}:{text:string;emphasis?:string;className?:string;breakBefore?:string}) {
  const value=stegaClean(text), phrase=stegaClean(emphasis||"");
  const pieces=phrase ? value.split(phrase) : [value];
  const lines=(part:string)=>breakBefore ? part.split(breakBefore).map((line,i)=><Fragment key={i}>{i>0&&<><br className="hidden md:block" />{breakBefore}</>}{line}</Fragment>) : part;
  return <>{pieces.map((piece,i)=><Fragment key={i}>{i>0&&<span className={className}>{phrase}</span>}{lines(piece)}</Fragment>)}</>;
}
