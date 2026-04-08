import{i as U,A as V,b as W,g as X}from"./iframe-maWesKjk.js";import{n as A}from"./property-DyW-YDBW.js";import{m as b}from"./localize-Cz1ya3ms.js";import{s as Y}from"./analysis-group-shared.styles-Cw1nMqQy.js";import"./analysis-group-ZyfAZWsO.js";import{l as Z}from"./localized-decorator-CXjGGqe_.js";const j=U`
  .help-text {
    display: inline-block;
    color: var(--secondary-text-color);
    opacity: 0.8;
    padding-top: 2px;
  }
`;var ee=Object.create,x=Object.defineProperty,te=Object.getOwnPropertyDescriptor,N=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),y=e=>{throw TypeError(e)},q=(e,t,a)=>t in e?x(e,t,{enumerable:!0,configurable:!0,writable:!0,value:a}):e[t]=a,F=(e,t)=>x(e,"name",{value:t,configurable:!0}),ae=e=>[,,,ee(e?.[N("metadata")]??null)],H=["class","method","getter","setter","accessor","field","value","get","set"],w=e=>e!==void 0&&typeof e!="function"?y("Function expected"):e,se=(e,t,a,n,i)=>({kind:H[e],name:t,metadata:n,addInitializer:o=>a._?y("Already initialized"):i.push(w(o||null))}),ie=(e,t)=>q(t,N("metadata"),e[3]),u=(e,t,a,n)=>{for(var i=0,o=e[t>>1],h=o&&o.length;i<h;i++)t&1?o[i].call(a):n=o[i].call(a,n);return n},f=(e,t,a,n,i,o)=>{var h,r,G,v,g,s=t&7,S=!!(t&8),p=!!(t&16),k=s>3?e.length+1:s?S?1:2:0,M=H[s+5],P=s>3&&(e[k-1]=[]),R=e[k]||(e[k]=[]),d=s&&(!p&&!S&&(i=i.prototype),s<5&&(s>3||!p)&&te(s<4?i:{get[a](){return T(this,o)},set[a](l){return B(this,o,l)}},a));s?p&&s<4&&F(o,(s>2?"set ":s>1?"get ":"")+a):F(i,a);for(var m=n.length-1;m>=0;m--)v=se(s,a,G={},e[3],R),s&&(v.static=S,v.private=p,g=v.access={has:p?l=>oe(i,l):l=>a in l},s^3&&(g.get=p?l=>(s^1?T:le)(l,i,s^4?o:d.get):l=>l[a]),s>2&&(g.set=p?(l,$)=>B(l,i,$,s^4?o:d.set):(l,$)=>l[a]=$)),r=(0,n[m])(s?s<4?p?o:d[M]:s>4?void 0:{get:d.get,set:d.set}:i,v),G._=1,s^4||r===void 0?w(r)&&(s>4?P.unshift(r):s?p?o=r:d[M]=r:i=r):typeof r!="object"||r===null?y("Object expected"):(w(h=r.get)&&(d.get=h),w(h=r.set)&&(d.set=h),w(h=r.init)&&P.unshift(h));return s||ie(e,i),d&&x(i,a,d),p?s^4?o:d:i},ne=(e,t,a)=>q(e,t+"",a),I=(e,t,a)=>t.has(e)||y("Cannot "+a),oe=(e,t)=>Object(t)!==t?y('Cannot use the "in" operator on this value'):e.has(t),T=(e,t,a)=>(I(e,t,"read from private field"),a?a.call(e):t.get(e)),C=(e,t,a)=>t.has(e)?y("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,a),B=(e,t,a,n)=>(I(e,t,"write to private field"),n?n.call(e,a):t.set(e,a),a),le=(e,t,a)=>(I(e,t,"access private method"),a),J,K,L,D,Q,c,O,z,E;Q=[Z()];class _ extends(D=X,L=[A({type:Object})],K=[A({type:String,attribute:"entity-id"})],J=[A({type:Boolean,attribute:"can-show-delta-analysis"})],D){constructor(){super(...arguments),C(this,O,u(c,8,this,{})),u(c,11,this),C(this,z,u(c,12,this,"")),u(c,15,this),C(this,E,u(c,16,this,!1)),u(c,19,this)}_emit(t,a){this.dispatchEvent(new CustomEvent("dp-group-analysis-change",{detail:{entityId:this.entityId,key:t,value:a},bubbles:!0,composed:!0}))}_onGroupChange(t){this._emit("show_delta_analysis",t.detail.checked)}_onCheckbox(t,a){this._emit(t,a.target.checked)}render(){const t=this.analysis,a=t.show_delta_analysis&&this.canShowDeltaAnalysis;return W`
      <analysis-group
        .label=${b("Show delta vs selected date window")}
        .checked=${a}
        .disabled=${!this.canShowDeltaAnalysis}
        .alignTop=${!0}
        @dp-group-change=${this._onGroupChange}
      >
        ${this.canShowDeltaAnalysis?V:W`
              <span slot="hint"
                ><br /><span class="help-text"
                  >${b("Select a date window tab to enable delta analysis.")}</span
                ></span
              >
            `}
        <label class="option">
          <input
            type="checkbox"
            .checked=${t.show_delta_tooltip}
            @change=${n=>this._onCheckbox("show_delta_tooltip",n)}
          />
          <span>${b("Show delta in tooltip")}</span>
        </label>
        <label class="option">
          <input
            type="checkbox"
            .checked=${t.show_delta_lines}
            @change=${n=>this._onCheckbox("show_delta_lines",n)}
          />
          <span>${b("Show delta lines")}</span>
        </label>
      </analysis-group>
    `}}c=ae(D);O=new WeakMap;z=new WeakMap;E=new WeakMap;f(c,4,"analysis",L,_,O);f(c,4,"entityId",K,_,z);f(c,4,"canShowDeltaAnalysis",J,_,E);_=f(c,0,"AnalysisDeltaGroup",Q,_);ne(_,"styles",[Y,j]);u(c,1,_);customElements.define("analysis-delta-group",_);
