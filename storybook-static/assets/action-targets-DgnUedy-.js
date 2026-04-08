import{i as Q,A as M,b as y,g as R}from"./iframe-maWesKjk.js";import{n as w}from"./property-DyW-YDBW.js";import{r as U}from"./state-D8ZE3MQ0.js";import"./chip-group-CRK0J3ni.js";const X=Q`
  :host {
    display: block;
  }

  .target-selector {
    display: block;
    width: 100%;
  }
`;var Y=Object.create,O=Object.defineProperty,Z=Object.getOwnPropertyDescriptor,W=(t,e)=>(e=Symbol[t])?e:Symbol.for("Symbol."+t),v=t=>{throw TypeError(t)},z=(t,e,a)=>e in t?O(t,e,{enumerable:!0,configurable:!0,writable:!0,value:a}):t[e]=a,tt=t=>[,,,Y(t?.[W("metadata")]??null)],A=["class","method","getter","setter","accessor","field","value","get","set"],u=t=>t!==void 0&&typeof t!="function"?v("Function expected"):t,et=(t,e,a,o,s)=>({kind:A[t],name:e,metadata:o,addInitializer:h=>a._?v("Already initialized"):s.push(u(h||null))}),at=(t,e)=>z(e,W("metadata"),t[3]),i=(t,e,a,o)=>{for(var s=0,h=t[e>>1],n=h&&h.length;s<n;s++)e&1?h[s].call(a):o=h[s].call(a,o);return o},f=(t,e,a,o,s,h)=>{for(var n,c,x,d,C,E=e&7,j=!1,q=!1,k=t.length+1,H=A[E+5],J=t[k-1]=[],K=t[k]||(t[k]=[]),_=(s=s.prototype,Z({get[a](){return st(this,h)},set[a](g){return it(this,h,g)}},a)),b=o.length-1;b>=0;b--)d=et(E,a,x={},t[3],K),d.static=j,d.private=q,C=d.access={has:g=>a in g},C.get=g=>g[a],C.set=(g,L)=>g[a]=L,c=(0,o[b])({get:_.get,set:_.set},d),x._=1,c===void 0?u(c)&&(_[H]=c):typeof c!="object"||c===null?v("Object expected"):(u(n=c.get)&&(_.get=n),u(n=c.set)&&(_.set=n),u(n=c.init)&&J.unshift(n));return _&&O(s,a,_),s},rt=(t,e,a)=>z(t,e+"",a),D=(t,e,a)=>e.has(t)||v("Cannot "+a),st=(t,e,a)=>(D(t,e,"read from private field"),e.get(t)),p=(t,e,a)=>e.has(t)?v("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,a),it=(t,e,a,o)=>(D(t,e,"write to private field"),e.set(t,a),a),F,I,B,G,N,T,r,m,$,P,S,V;class l extends(T=R,N=[w({attribute:!1})],G=[w({type:Boolean,attribute:"show-config-targets"})],B=[w({type:Boolean,attribute:"show-target-picker"})],I=[w({attribute:!1})],F=[U()],T){constructor(){super(...arguments),p(this,m,i(r,8,this,null)),i(r,11,this),p(this,$,i(r,12,this,!0)),i(r,15,this),p(this,P,i(r,16,this,!0)),i(r,19,this),p(this,S,i(r,20,this,[])),i(r,23,this),p(this,V,i(r,24,this,{})),i(r,27,this)}resetSelection(){this._targetValue={}}_onTargetChanged(e){this._targetValue=e.detail.value||{},this.dispatchEvent(new CustomEvent("dp-target-change",{detail:{value:this._targetValue},bubbles:!0,composed:!0}))}render(){const e=this.configChips.length>0;return y`
      ${this.showConfigTargets&&e?y`
            <chip-group
              .items=${this.configChips}
              .hass=${this.hass}
              .removable=${!1}
              label="Data point will be associated with"
            ></chip-group>
          `:M}
      ${this.showTargetPicker?y`
            <ha-selector
              id="target-sel"
              class="target-selector"
              .selector=${{target:{}}}
              .hass=${this.hass}
              .value=${this._targetValue}
              @value-changed=${this._onTargetChanged}
            ></ha-selector>
          `:M}
    `}}r=tt(T);m=new WeakMap;$=new WeakMap;P=new WeakMap;S=new WeakMap;V=new WeakMap;f(r,4,"hass",N,l,m);f(r,4,"showConfigTargets",G,l,$);f(r,4,"showTargetPicker",B,l,P);f(r,4,"configChips",I,l,S);f(r,4,"_targetValue",F,l,V);at(r,l);rt(l,"styles",X);customElements.define("action-targets",l);
