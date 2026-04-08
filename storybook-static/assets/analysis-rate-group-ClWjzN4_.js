import{i as J,b as k,g as K}from"./iframe-maWesKjk.js";import{n as W}from"./property-DyW-YDBW.js";import{m as g}from"./localize-Cz1ya3ms.js";import{s as Q}from"./analysis-group-shared.styles-Cw1nMqQy.js";import"./analysis-group-ZyfAZWsO.js";import{l as U}from"./localized-decorator-CXjGGqe_.js";const V=J``;var X=Object.create,I=Object.defineProperty,Z=Object.getOwnPropertyDescriptor,F=(t,e)=>(e=Symbol[t])?e:Symbol.for("Symbol."+t),u=t=>{throw TypeError(t)},T=(t,e,a)=>e in t?I(t,e,{enumerable:!0,configurable:!0,writable:!0,value:a}):t[e]=a,M=(t,e)=>I(t,"name",{value:e,configurable:!0}),j=t=>[,,,X(t?.[F("metadata")]??null)],L=["class","method","getter","setter","accessor","field","value","get","set"],y=t=>t!==void 0&&typeof t!="function"?u("Function expected"):t,ee=(t,e,a,o,i)=>({kind:L[t],name:e,metadata:o,addInitializer:r=>a._?u("Already initialized"):i.push(y(r||null))}),te=(t,e)=>T(e,F("metadata"),t[3]),f=(t,e,a,o)=>{for(var i=0,r=t[e>>1],d=r&&r.length;i<d;i++)e&1?r[i].call(a):o=r[i].call(a,o);return o},C=(t,e,a,o,i,r)=>{var d,l,P,v,b,s=e&7,m=!!(e&8),_=!!(e&16),w=s>3?t.length+1:s?m?1:2:0,G=L[s+5],R=s>3&&(t[w-1]=[]),H=t[w]||(t[w]=[]),c=s&&(!_&&!m&&(i=i.prototype),s<5&&(s>3||!_)&&Z(s<4?i:{get[a](){return N(this,r)},set[a](n){return D(this,r,n)}},a));s?_&&s<4&&M(r,(s>2?"set ":s>1?"get ":"")+a):M(i,a);for(var S=o.length-1;S>=0;S--)v=ee(s,a,P={},t[3],H),s&&(v.static=m,v.private=_,b=v.access={has:_?n=>se(i,n):n=>a in n},s^3&&(b.get=_?n=>(s^1?N:ie)(n,i,s^4?r:c.get):n=>n[a]),s>2&&(b.set=_?(n,$)=>D(n,i,$,s^4?r:c.set):(n,$)=>n[a]=$)),l=(0,o[S])(s?s<4?_?r:c[G]:s>4?void 0:{get:c.get,set:c.set}:i,v),P._=1,s^4||l===void 0?y(l)&&(s>4?R.unshift(l):s?_?r=l:c[G]=l:i=l):typeof l!="object"||l===null?u("Object expected"):(y(d=l.get)&&(c.get=d),y(d=l.set)&&(c.set=d),y(d=l.init)&&R.unshift(d));return s||te(t,i),c&&I(i,a,c),_?s^4?r:c:i},ae=(t,e,a)=>T(t,e+"",a),z=(t,e,a)=>e.has(t)||u("Cannot "+a),se=(t,e)=>Object(e)!==e?u('Cannot use the "in" operator on this value'):t.has(e),N=(t,e,a)=>(z(t,e,"read from private field"),a?a.call(t):e.get(t)),x=(t,e,a)=>e.has(t)?u("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,a),D=(t,e,a,o)=>(z(t,e,"write to private field"),o?o.call(t,a):e.set(t,a),a),ie=(t,e,a)=>(z(t,e,"access private method"),a),Y,q,O,B,h,A,E;const re=[{value:"point_to_point",label:"Point to point"},{value:"1h",label:"1 hour"},{value:"6h",label:"6 hours"},{value:"24h",label:"24 hours"}];B=[U()];class p extends(O=K,q=[W({type:Object})],Y=[W({type:String,attribute:"entity-id"})],O){constructor(){super(...arguments),x(this,A,f(h,8,this,{})),f(h,11,this),x(this,E,f(h,12,this,"")),f(h,15,this)}_emit(e,a){this.dispatchEvent(new CustomEvent("dp-group-analysis-change",{detail:{entityId:this.entityId,key:e,value:a},bubbles:!0,composed:!0}))}_localizedOptions(e){return e.map(a=>({...a,label:g(a.label)}))}_renderSelect(e,a,o){return k`
      <select
        class="select"
        @change=${i=>this._emit(e,i.target.value)}
      >
        ${a.map(i=>k`<option value=${i.value} ?selected=${i.value===o}>
              ${i.label}
            </option>`)}
      </select>
    `}_onGroupChange(e){this._emit("show_rate_of_change",e.detail.checked)}_onCheckbox(e,a){this._emit(e,a.target.checked)}render(){const e=this.analysis;return k`
      <analysis-group
        .label=${g("Show rate of change")}
        .checked=${e.show_rate_of_change}
        @dp-group-change=${this._onGroupChange}
      >
        <label class="option">
          <input
            type="checkbox"
            .checked=${e.show_rate_crosshairs}
            @change=${a=>this._onCheckbox("show_rate_crosshairs",a)}
          />
          <span>${g("Show rate of change crosshairs")}</span>
        </label>
        <label class="field">
          <span class="field-label">${g("Rate window")}</span>
          ${this._renderSelect("rate_window",this._localizedOptions(re),e.rate_window)}
        </label>
      </analysis-group>
    `}}h=j(O);A=new WeakMap;E=new WeakMap;C(h,4,"analysis",q,p,A);C(h,4,"entityId",Y,p,E);p=C(h,0,"AnalysisRateGroup",B,p);ae(p,"styles",[Q,V]);f(h,1,p);customElements.define("analysis-rate-group",p);
