"use strict";Object.defineProperty(exports,Symbol.toStringTag,{value:"Module"});const t=require("./parse.cjs");require("chalk");var u=Object.defineProperty,l=Object.getOwnPropertyDescriptor,s=(p,r,e,a)=>{for(var i=a>1?void 0:a?l(r,e):r,o=p.length-1,m;o>=0;o--)(m=p[o])&&(i=(a?m(r,e,i):m(i))||i);return a&&i&&u(r,e,i),i};const y=t.string(",").trim(),c=t.string("=").trim(),h=t.string(";").trim(),g=t.string(".").trim(),f=t.string("?").trim(),x=t.string("?w").trim(),v=t.string("??").trim(),k=t.string("|").trim(),w=t.string("+").trim(),b=t.string("-").trim(),z=t.string("*").trim();t.string("/").trim();const d=t.string(">>").trim(),G=t.string("<<").trim(),_=t.any(h,g);class n{identifier(){return t.regex(/[_a-zA-Z][_a-zA-Z0-9]*/).trim()}literal(){return t.any(t.regex(/[^"]+/).wrap(t.string('"'),t.string('"')),t.regex(/[^']+/).wrap(t.string("'"),t.string("'"))).map(r=>({type:"literal",value:r}))}epsilon(){return t.any(t.string("epsilon"),t.string("ε"),t.string("ϵ")).trim().map(r=>({type:"epsilon",value:void 0}))}nonterminal(){return this.identifier().map(r=>({type:"nonterminal",value:r}))}group(){return this.expression().trim().wrap(t.string("("),t.string(")")).map(r=>({type:"group",value:r}))}eof(){return t.string("$").trim().map(r=>({type:"eof",value:r}))}regex(){return t.regex(/[^\/]*/).wrap(t.string("/"),t.string("/")).map(r=>({type:"regex",value:new RegExp(r)}))}optional(){return this.term().skip(f).map(r=>({type:"optional",value:r}))}optionalGroup(){return this.expression().trim().wrap(t.string("["),t.string("]")).map(r=>({type:"optional",value:r}))}optionalWhitespace(){return this.term().skip(x).map(r=>({type:"optionalWhitespace",value:r}))}coalesce(){return t.all(this.term().skip(v),this.factor()).map(([r,e])=>({type:"coalesce",value:[r,e]}))}subtraction(){return t.all(this.term().skip(b),this.term()).map(([r,e])=>({type:"minus",value:[r,e]}))}manyGroup(){return this.expression().trim().wrap(t.string("{"),t.string("}")).map(r=>({type:"many",value:r}))}many(){return this.term().skip(z).map(r=>({type:"many",value:r}))}many1(){return this.term().skip(w).map(r=>({type:"many1",value:r}))}next(){return t.all(this.factor().skip(d),t.any(this.skip(),this.factor())).map(([r,e])=>({type:"next",value:[r,e]}))}skip(){return t.all(t.any(this.next(),this.factor()).skip(G),this.factor()).map(([r,e])=>({type:"skip",value:[r,e]}))}concatenation(){return t.any(this.skip(),this.next(),this.factor()).sepBy(y,1).map(r=>({type:"concatenation",value:r}))}alternation(){return t.any(this.concatenation(),this.skip(),this.next(),this.factor()).sepBy(k,1).map(r=>({type:"alternation",value:r}))}bigComment(){return t.regex(/\/\*[^]*?\*\//).trim().map(r=>({type:"comment",expression:{type:"literal",value:r}}))}term(){return t.any(this.epsilon(),this.literal(),this.nonterminal(),this.regex(),this.group(),this.optionalGroup(),this.manyGroup(),this.eof()).trim(this.bigComment().opt())}factor(){return t.any(this.coalesce(),this.optionalWhitespace(),this.optional(),this.many(),this.many1(),this.subtraction(),this.term())}comment(){return t.regex(/\/\/.*/).trim().map(r=>({type:"comment",expression:{type:"literal",value:r}})).or(this.bigComment())}expression(){return t.any(this.alternation(),this.concatenation(),this.skip(),this.next(),this.factor())}productionRule(){return t.all(this.identifier().skip(c),this.expression().skip(_)).map(([r,e])=>({name:r,expression:e,type:"productionRule"}))}grammar(){return t.all(this.comment().many(),this.productionRule(),this.comment().many()).many(1).map(r=>r.flat(2))}}s([t.lazy],n.prototype,"group",1);s([t.lazy],n.prototype,"regex",1);s([t.lazy],n.prototype,"optionalGroup",1);s([t.lazy],n.prototype,"coalesce",1);s([t.lazy],n.prototype,"manyGroup",1);s([t.lazy],n.prototype,"next",1);s([t.lazy],n.prototype,"skip",1);exports.EBNFGrammar=n;
