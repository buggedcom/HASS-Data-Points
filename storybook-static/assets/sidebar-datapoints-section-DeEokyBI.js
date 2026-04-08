import{i as R,b as U,g as V}from"./iframe-maWesKjk.js";import{n as y}from"./property-DyW-YDBW.js";import{m as C}from"./localize-Cz1ya3ms.js";import"./sidebar-options-section-XIovhKDU.js";import"./radio-group-CFoLmpSs.js";import{l as X}from"./localized-decorator-CXjGGqe_.js";const Y=R`
  :host {
    display: block;
  }
`;var Z=Object.create,P=Object.defineProperty,j=Object.getOwnPropertyDescriptor,G=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),u=e=>{throw TypeError(e)},H=(e,t,a)=>t in e?P(e,t,{enumerable:!0,configurable:!0,writable:!0,value:a}):e[t]=a,F=(e,t)=>P(e,"name",{value:t,configurable:!0}),ee=e=>[,,,Z(e?.[G("metadata")]??null)],L=["class","method","getter","setter","accessor","field","value","get","set"],S=e=>e!==void 0&&typeof e!="function"?u("Function expected"):e,te=(e,t,a,p,o)=>({kind:L[e],name:t,metadata:p,addInitializer:s=>a._?u("Already initialized"):o.push(S(s||null))}),ae=(e,t)=>H(t,G("metadata"),e[3]),v=(e,t,a,p)=>{for(var o=0,s=e[t>>1],_=s&&s.length;o<_;o++)t&1?s[o].call(a):p=s[o].call(a,p);return p},f=(e,t,a,p,o,s)=>{var _,n,M,b,m,i=t&7,g=!!(t&8),d=!!(t&16),O=i>3?e.length+1:i?g?1:2:0,T=L[i+5],W=i>3&&(e[O-1]=[]),Q=e[O]||(e[O]=[]),c=i&&(!d&&!g&&(o=o.prototype),i<5&&(i>3||!d)&&j(i<4?o:{get[a](){return N(this,s)},set[a](r){return B(this,s,r)}},a));i?d&&i<4&&F(s,(i>2?"set ":i>1?"get ":"")+a):F(o,a);for(var k=p.length-1;k>=0;k--)b=te(i,a,M={},e[3],Q),i&&(b.static=g,b.private=d,m=b.access={has:d?r=>oe(o,r):r=>a in r},i^3&&(m.get=d?r=>(i^1?N:se)(r,o,i^4?s:c.get):r=>r[a]),i>2&&(m.set=d?(r,w)=>B(r,o,w,i^4?s:c.set):(r,w)=>r[a]=w)),n=(0,p[k])(i?i<4?d?s:c[T]:i>4?void 0:{get:c.get,set:c.set}:o,b),M._=1,i^4||n===void 0?S(n)&&(i>4?W.unshift(n):i?d?s=n:c[T]=n:o=n):typeof n!="object"||n===null?u("Object expected"):(S(_=n.get)&&(c.get=_),S(_=n.set)&&(c.set=_),S(_=n.init)&&W.unshift(_));return i||ae(e,o),c&&P(o,a,c),d?i^4?s:c:o},ie=(e,t,a)=>H(e,t+"",a),D=(e,t,a)=>t.has(e)||u("Cannot "+a),oe=(e,t)=>Object(t)!==t?u('Cannot use the "in" operator on this value'):e.has(t),N=(e,t,a)=>(D(e,t,"read from private field"),a?a.call(e):t.get(e)),$=(e,t,a)=>t.has(e)?u("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,a),B=(e,t,a,p)=>(D(e,t,"write to private field"),p?p.call(e,a):t.set(e,a),a),se=(e,t,a)=>(D(e,t,"access private method"),a),q,x,J,z,K,l,E,I,A;const re=[{value:"linked",label:"Linked to selected targets"},{value:"all",label:"All datapoints"},{value:"hidden",label:"Hide datapoints"}];K=[X()];class h extends(z=V,J=[y({type:String,attribute:"datapoint-scope"})],x=[y({type:Boolean})],q=[y({type:Boolean})],z){constructor(){super(...arguments),$(this,E,v(l,8,this,"linked")),v(l,11,this),$(this,I,v(l,12,this,!1)),v(l,15,this),$(this,A,v(l,16,this,!0)),v(l,19,this)}_onScopeChange(t){this.dispatchEvent(new CustomEvent("dp-scope-change",{detail:{value:t.detail.value},bubbles:!0,composed:!0}))}_localizedOptions(t){return t.map(a=>({...a,label:C(a.label)}))}render(){return U`
      <sidebar-options-section
        .title=${C("Datapoints")}
        .subtitle=${C("Choose which annotation datapoints appear on the chart.")}
        .collapsible=${this.collapsible}
        .open=${this.open}
      >
        <radio-group
          .name=${"datapoint-scope"}
          .value=${this.datapointScope}
          .options=${this._localizedOptions(re)}
          @dp-radio-change=${this._onScopeChange}
        ></radio-group>
      </sidebar-options-section>
    `}}l=ee(z);E=new WeakMap;I=new WeakMap;A=new WeakMap;f(l,4,"datapointScope",J,h,E);f(l,4,"collapsible",x,h,I);f(l,4,"open",q,h,A);h=f(l,0,"SidebarDatapointsSection",K,h);ie(h,"styles",Y);v(l,1,h);customElements.define("sidebar-datapoints-section",h);
