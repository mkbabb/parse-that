"use strict";var b=Object.defineProperty;var A=(r,e,o)=>e in r?b(r,e,{enumerable:!0,configurable:!0,writable:!0,value:o}):r[e]=o;var g=(r,e,o)=>(A(r,typeof e!="symbol"?e+"":e,o),o);Object.defineProperty(exports,Symbol.toStringTag,{value:"Module"});const n=require("./parse.cjs");require("chalk");var B=Object.defineProperty,S=Object.getOwnPropertyDescriptor,p=(r,e,o,t)=>{for(var a=t>1?void 0:t?S(e,o):e,i=r.length-1,s;i>=0;i--)(s=r[i])&&(a=(t?s(e,o,a):s(a))||a);return t&&a&&B(e,o,a),a};const h={"|":"alternation",",":"concatenation","-":"minus","<<":"skip",">>":"next","*":"many","+":"many1","?":"optional","?w":"optionalWhitespace"},T=([r,e])=>e.length===0?r:e.reduce((o,[t,a])=>({type:h[t],value:[o,a]}),r),C=([r,e])=>e===void 0?r:{type:h[e],value:r},_={debug:!1,comments:!0};class c{constructor(e){g(this,"options");this.options={..._,...e??{}}}identifier(){return n.regex(/[_a-zA-Z][_a-zA-Z0-9]*/).trim()}literal(){return this.trimBigComment(n.any(n.regex(/[^"]+/).wrap(n.string('"'),n.string('"')),n.regex(/[^']+/).wrap(n.string("'"),n.string("'"))).map(e=>({type:"literal",value:e})))}epsilon(){return n.any(n.string("epsilon"),n.string("ε")).trim().map(e=>({type:"epsilon",value:void 0}))}nonterminal(){return this.identifier().map(e=>({type:"nonterminal",value:e}))}bigComment(){return n.regex(/\/\*[^\*]*\*\//).trim()}comment(){return n.regex(/\/\/.*/).or(this.bigComment()).trim()}trimBigComment(e){return e.trim(this.bigComment().many(),!1).map(([o,t,a])=>(t.comment={left:o,right:a},t))}group(){return this.rhs().trim().wrap(n.string("("),n.string(")")).map(e=>({type:"group",value:e}))}regex(){return n.regex(/[^\/]*/).wrap(n.string("/"),n.string("/")).then(n.regex(/[gimuy]*/).opt()).map(([e,o])=>({type:"regex",value:new RegExp(e,o)}))}optionalGroup(){return this.rhs().trim().wrap(n.string("["),n.string("]")).map(e=>({type:"optional",value:e}))}manyGroup(){return this.rhs().trim().wrap(n.string("{"),n.string("}")).map(e=>({type:"many",value:e}))}lhs(){return this.identifier()}term(){return n.any(this.epsilon(),this.group(),this.optionalGroup(),this.manyGroup(),this.nonterminal(),this.literal(),this.regex())}factor(){return this.trimBigComment(n.all(this.term(),n.any(n.string("?w").trim(),n.string("?").trim(),n.string("*").trim(),n.string("+").trim()).opt()).map(C))}binaryFactor(){return n.all(this.factor(),n.all(n.any(n.string("<<").trim(),n.string(">>").trim(),n.string("-").trim()),this.factor()).many()).map(T)}concatenation(){return this.binaryFactor().sepBy(n.string(",").trim()).map(e=>e.length===1?e[0]:{type:"concatenation",value:e})}alternation(){return this.concatenation().sepBy(n.string("|").trim()).map(e=>e.length===1?e[0]:{type:"alternation",value:e})}rhs(){return this.alternation()}productionRule(){return n.all(this.lhs(),n.string("=").trim(),this.rhs(),n.any(n.string(";"),n.string(".")).trim()).map(([e,,o])=>({name:e,expression:o}))}grammar(){return this.productionRule().trim(this.comment().many(),!1).map(([e,o,t])=>(o.comment={above:e,below:t},o)).many(1)}}p([n.lazy],c.prototype,"bigComment",1);p([n.lazy],c.prototype,"comment",1);p([n.lazy],c.prototype,"group",1);p([n.lazy],c.prototype,"regex",1);p([n.lazy],c.prototype,"optionalGroup",1);p([n.lazy],c.prototype,"manyGroup",1);p([n.lazy],c.prototype,"lhs",1);p([n.lazy],c.prototype,"term",1);p([n.lazy],c.prototype,"factor",1);p([n.lazy],c.prototype,"binaryFactor",1);p([n.lazy],c.prototype,"concatenation",1);p([n.lazy],c.prototype,"alternation",1);p([n.lazy],c.prototype,"rhs",1);p([n.lazy],c.prototype,"productionRule",1);p([n.lazy],c.prototype,"grammar",1);function d(r){const e=new Set,o=[];function t(i,s){if(s.has(i)||e.has(i))return;s.add(i);const l=r.get(i);if(!l)return;const u=l.expression;if(u.type==="nonterminal")t(u.value,s);else if(u.value instanceof Array)for(const m of u.value)m.type==="nonterminal"&&t(m.value,s);e.add(i),s.delete(i),o.unshift(r.get(i))}for(const[i]of r)t(i,new Set);const a=new Map;for(const i of o)a.set(i.name,i);return a}const f=(r,e)=>{if(!(!(r!=null&&r.type)||!(e!=null&&e.type)||r.type!==e.type))switch(r.type){case"literal":case"nonterminal":return r.value!==e.value?void 0:[r,{type:"epsilon"},{type:"epsilon"}];case"group":case"optional":case"optionalWhitespace":case"many":case"many1":{const o=f(r.value,e.value);return o?[{type:r.type,value:o[0]},{type:r.type,value:o[1]},{type:r.type,value:o[2]}]:void 0}case"concatenation":{const o=r.value.map((u,m)=>f(r.value[m],e.value[m]));if(o.some(u=>u===void 0))return;const t=o.map(u=>u[0]),a=o.map(u=>u[1]),i=o.map(u=>u[2]),s=t.lastIndexOf(null);return s===t.length-1?void 0:[{type:"concatenation",value:t.slice(s+1)},{type:"concatenation",value:a},{type:"concatenation",value:i}]}case"alternation":for(const o of r.value){const t=f(o,e);if(t)return t}for(const o of e.value){const t=f(r,o);if(t)return t}return}},y=(r,e)=>{if(r.type!==e.type)return!1;switch(r.type){case"literal":case"nonterminal":return r.value===e.value;case"group":case"optional":case"many":case"many1":return y(r.value,e.value);case"minus":case"skip":case"next":return y(r.value[0],e.value[0])&&y(r.value[1],e.value[1]);case"concatenation":return r.value.every((o,t)=>y(o,e.value[t]));case"alternation":return r.value.some((o,t)=>y(o,e.value[t]));case"epsilon":return!0}};function w(r,e){const o=new Map;let t=null;for(let a=0;a<e.value.length-1;a++){const i=e.value[a],s=e.value[a+1],l=f(i,s);if(l){const[u,m,v]=l;t!==null&&y(u,t)?o.get(t).push(v):(o.set(u,[m,v]),t=u),a===e.value.length-2&&e.value.shift(),e.value.shift(),a-=1}}for(const[a,i]of o){const l={type:"concatenation",value:[{type:"group",value:{type:"alternation",value:i}},{type:"group",value:a}]};e.value.push(l)}}const L=(r,e,o)=>{const t=[],a=[],i={type:"nonterminal",value:o};for(let s=0;s<e.value.length;s++){const l=e.value[s];l.type==="concatenation"&&l.value[0].value===r?a.push({type:"concatenation",value:[...l.value.slice(1),i]}):t.push({type:"concatenation",value:[l,i]})}return a.length===0?[void 0,void 0]:(a.push({type:"epsilon"}),[{type:"alternation",value:t},{type:"alternation",value:a}])};function z(r){const e=new Map;let o=0;for(const[t,a]of r){const{expression:i}=a;if(i.type==="alternation"){const s=`${t}_${o++}`,[l,u]=L(t,i,s);l&&(e.set(s,{name:s,expression:u}),e.set(t,{name:t,expression:l,comment:a.comment}))}}if(e.size===0)return r;for(const[t,a]of e)r.set(t,a);for(const[t,a]of r){const{expression:i}=a;i.type==="alternation"&&w(t,i)}}function E(r){const e=(o,t)=>{t.type==="concatenation"&&t.value[0].type==="nonterminal"&&t.value[0].value===o&&(t.value.slice(1,t.value.length),t.value.shift())};for(const[o,t]of r)e(o,t)}function P(r){const e=d(r);return z(e),e}function R(r){const e=new c().grammar(),o=e.parse(r);if(!o)return[e];const t=o.reduce((a,i,s)=>a.set(i.name,i),new Map);return[e,t]}function F(r){function e(t,a){var i,s;switch(a.type){case"literal":return n.string(a.value);case"nonterminal":const l=n.Parser.lazy(()=>o[a.value]);return l.context.name=a.value,l;case"epsilon":return n.eof().opt();case"group":return e(t,a.value);case"regex":return n.regex(a.value);case"optionalWhitespace":return e(t,a.value).trim();case"optional":return e(t,a.value).opt();case"many":return e(t,a.value).many();case"many1":return e(t,a.value).many(1);case"skip":return e(t,a.value[0]).skip(e(t,a.value[1]));case"next":return e(t,a.value[0]).next(e(t,a.value[1]));case"minus":return e(t,a.value[0]).not(e(t,a.value[1]));case"concatenation":{const u=a.value.map(m=>e(t,m));return((s=(i=u.at(-1))==null?void 0:i.context)==null?void 0:s.name)==="eof"&&u.pop(),n.all(...u)}case"alternation":return n.any(...a.value.map(u=>e(t,u)))}}const o={};for(const[t,a]of r.entries())o[t]=e(t,a.expression);return o}function G(r,e=!1){let[o,t]=R(r);return e&&(t=P(t)),[F(t),t]}exports.EBNFGrammar=c;exports.comparePrefix=y;exports.findCommonPrefix=f;exports.generateASTFromEBNF=R;exports.generateParserFromAST=F;exports.generateParserFromEBNF=G;exports.removeAllLeftRecursion=P;exports.removeDirectLeftRecursion=z;exports.removeIndirectLeftRecursion=E;exports.rewriteTreeLeftRecursion=w;exports.topologicalSort=d;
//# sourceMappingURL=ebnf.cjs.map
