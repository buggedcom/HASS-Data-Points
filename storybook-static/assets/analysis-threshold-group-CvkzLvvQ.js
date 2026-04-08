import{i as V,b,A as F,g as X}from"./iframe-maWesKjk.js";import{n as C}from"./property-DyW-YDBW.js";import{m as v}from"./localize-Cz1ya3ms.js";import{s as Y}from"./analysis-group-shared.styles-Cw1nMqQy.js";import"./analysis-group-ZyfAZWsO.js";import{l as Z}from"./localized-decorator-CXjGGqe_.js";const j=V``;var ee=Object.create,A=Object.defineProperty,te=Object.getOwnPropertyDescriptor,B=(t,e)=>(e=Symbol[t])?e:Symbol.for("Symbol."+t),y=t=>{throw TypeError(t)},H=(t,e,s)=>e in t?A(t,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[e]=s,D=(t,e)=>A(t,"name",{value:e,configurable:!0}),se=t=>[,,,ee(t?.[B("metadata")]??null)],J=["class","method","getter","setter","accessor","field","value","get","set"],f=t=>t!==void 0&&typeof t!="function"?y("Function expected"):t,ae=(t,e,s,r,i)=>({kind:J[t],name:e,metadata:r,addInitializer:l=>s._?y("Already initialized"):i.push(f(l||null))}),ie=(t,e)=>H(e,B("metadata"),t[3]),u=(t,e,s,r)=>{for(var i=0,l=t[e>>1],_=l&&l.length;i<_;i++)e&1?l[i].call(s):r=l[i].call(s,r);return r},m=(t,e,s,r,i,l)=>{var _,o,P,g,$,a=e&7,w=!!(e&8),c=!!(e&16),S=a>3?t.length+1:a?w?1:2:0,W=J[a+5],x=a>3&&(t[S-1]=[]),U=t[S]||(t[S]=[]),d=a&&(!c&&!w&&(i=i.prototype),a<5&&(a>3||!c)&&te(a<4?i:{get[s](){return N(this,l)},set[s](n){return q(this,l,n)}},s));a?c&&a<4&&D(l,(a>2?"set ":a>1?"get ":"")+s):D(i,s);for(var k=r.length-1;k>=0;k--)g=ae(a,s,P={},t[3],U),a&&(g.static=w,g.private=c,$=g.access={has:c?n=>re(i,n):n=>s in n},a^3&&($.get=c?n=>(a^1?N:ne)(n,i,a^4?l:d.get):n=>n[s]),a>2&&($.set=c?(n,I)=>q(n,i,I,a^4?l:d.set):(n,I)=>n[s]=I)),o=(0,r[k])(a?a<4?c?l:d[W]:a>4?void 0:{get:d.get,set:d.set}:i,g),P._=1,a^4||o===void 0?f(o)&&(a>4?x.unshift(o):a?c?l=o:d[W]=o:i=o):typeof o!="object"||o===null?y("Object expected"):(f(_=o.get)&&(d.get=_),f(_=o.set)&&(d.set=_),f(_=o.init)&&x.unshift(_));return a||ie(t,i),d&&A(i,s,d),c?a^4?l:d:i},le=(t,e,s)=>H(t,e+"",s),E=(t,e,s)=>e.has(t)||y("Cannot "+s),re=(t,e)=>Object(e)!==e?y('Cannot use the "in" operator on this value'):t.has(e),N=(t,e,s)=>(E(t,e,"read from private field"),s?s.call(t):e.get(t)),O=(t,e,s)=>e.has(t)?y("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,s),q=(t,e,s,r)=>(E(t,e,"write to private field"),r?r.call(t,s):e.set(t,s),s),ne=(t,e,s)=>(E(t,e,"access private method"),s),K,L,Q,z,R,h,G,T,M;R=[Z()];class p extends(z=X,Q=[C({type:Object})],L=[C({type:String,attribute:"entity-id"})],K=[C({type:String})],z){constructor(){super(...arguments),O(this,G,u(h,8,this,{})),u(h,11,this),O(this,T,u(h,12,this,"")),u(h,15,this),O(this,M,u(h,16,this,"")),u(h,19,this)}_emit(e,s){this.dispatchEvent(new CustomEvent("dp-group-analysis-change",{detail:{entityId:this.entityId,key:e,value:s},bubbles:!0,composed:!0}))}_localizedOptions(e){return e.map(s=>({...s,label:v(s.label)}))}_renderSelect(e,s,r){return b`
      <select
        class="select"
        @change=${i=>this._emit(e,i.target.value)}
      >
        ${s.map(i=>b`<option value=${i.value} ?selected=${i.value===r}>
              ${i.label}
            </option>`)}
      </select>
    `}_onGroupChange(e){this._emit("show_threshold_analysis",e.detail.checked)}_onCheckbox(e,s){this._emit(e,s.target.checked)}_onInput(e,s){this._emit(e,s.target.value)}render(){const e=this.analysis;return b`
      <analysis-group
        .label=${v("Show threshold analysis")}
        .checked=${e.show_threshold_analysis}
        @dp-group-change=${this._onGroupChange}
      >
        <label class="option">
          <input
            type="checkbox"
            .checked=${e.show_threshold_shading}
            @change=${s=>this._onCheckbox("show_threshold_shading",s)}
          />
          <span>${v("Shade threshold area")}</span>
        </label>
        <label class="field">
          <span class="field-label">${v("Threshold")}</span>
          <div class="toggle-group">
            <input
              class="input"
              type="number"
              step="any"
              inputmode="decimal"
              .value=${e.threshold_value}
              placeholder=${v("Threshold")}
              @change=${s=>this._onInput("threshold_value",s)}
            />
            ${this.unit?b`<span>${this.unit}</span>`:F}
          </div>
        </label>
        ${e.show_threshold_shading?b`
              <label class="field">
                <span class="field-label">${v("Shade area")}</span>
                ${this._renderSelect("threshold_direction",this._localizedOptions([{value:"above",label:"Shade above"},{value:"below",label:"Shade below"}]),e.threshold_direction)}
              </label>
            `:F}
      </analysis-group>
    `}}h=se(z);G=new WeakMap;T=new WeakMap;M=new WeakMap;m(h,4,"analysis",Q,p,G);m(h,4,"entityId",L,p,T);m(h,4,"unit",K,p,M);p=m(h,0,"AnalysisThresholdGroup",R,p);le(p,"styles",[Y,j]);u(h,1,p);customElements.define("analysis-threshold-group",p);
