import{i as K,A as Q,b as w,g as U}from"./iframe-maWesKjk.js";import{n as v}from"./property-DyW-YDBW.js";import{c as V}from"./repeat-Dcg3Fkk0.js";import"./annotation-chip-BpF_qtuH.js";const X=K`
  :host {
    display: block;
  }

  .context-form-field {
    display: grid;
    gap: 6px;
    min-width: 0;
  }

  .context-form-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--primary-text-color);
  }

  .context-form-help {
    font-size: 0.8rem;
    color: var(--secondary-text-color);
    line-height: 1.45;
  }

  .context-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
`;var Y=Object.create,E=Object.defineProperty,Z=Object.getOwnPropertyDescriptor,M=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),y=e=>{throw TypeError(e)},P=(e,t,i)=>t in e?E(e,t,{enumerable:!0,configurable:!0,writable:!0,value:i}):e[t]=i,tt=e=>[,,,Y(e?.[M("metadata")]??null)],W=["class","method","getter","setter","accessor","field","value","get","set"],f=e=>e!==void 0&&typeof e!="function"?y("Function expected"):e,et=(e,t,i,o,r)=>({kind:W[e],name:t,metadata:o,addInitializer:n=>i._?y("Already initialized"):r.push(f(n||null))}),it=(e,t)=>P(t,M("metadata"),e[3]),s=(e,t,i,o)=>{for(var r=0,n=e[t>>1],p=n&&n.length;r<p;r++)t&1?n[r].call(i):o=n[r].call(i,o);return o},x=(e,t,i,o,r,n)=>{for(var p,l,z,_,u,I=t&7,G=!1,L=!1,g=e.length+1,q=W[I+5],B=e[g-1]=[],H=e[g]||(e[g]=[]),d=(r=r.prototype,Z({get[i](){return rt(this,n)},set[i](h){return st(this,n,h)}},i)),b=o.length-1;b>=0;b--)_=et(I,i,z={},e[3],H),_.static=G,_.private=L,u=_.access={has:h=>i in h},u.get=h=>h[i],u.set=(h,J)=>h[i]=J,l=(0,o[b])({get:d.get,set:d.set},_),z._=1,l===void 0?f(l)&&(d[q]=l):typeof l!="object"||l===null?y("Object expected"):(f(p=l.get)&&(d.get=p),f(p=l.set)&&(d.set=p),f(p=l.init)&&B.unshift(p));return d&&E(r,i,d),r},at=(e,t,i)=>P(e,t+"",i),A=(e,t,i)=>t.has(e)||y("Cannot "+i),rt=(e,t,i)=>(A(e,t,"read from private field"),t.get(e)),m=(e,t,i)=>t.has(e)?y("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,i),st=(e,t,i,o)=>(A(e,t,"write to private field"),t.set(e,i),i),R,j,F,D,N,$,a,k,T,S,O,C;class c extends($=U,N=[v({type:Array})],D=[v({type:Object,attribute:!1})],F=[v({type:String})],j=[v({type:String,attribute:"help-text"})],R=[v({type:String,attribute:"empty-text"})],$){constructor(){super(...arguments),m(this,k,s(a,8,this,[])),s(a,11,this),m(this,T,s(a,12,this,null)),s(a,15,this),m(this,S,s(a,16,this,"Linked targets")),s(a,19,this),m(this,O,s(a,20,this,"These targets will be associated with the new data point by default. Remove any that should not be linked.")),s(a,23,this),m(this,C,s(a,24,this,"No linked targets will be associated with this data point.")),s(a,27,this)}_onChipRemove(t){const i=t.detail;t.stopPropagation(),this.dispatchEvent(new CustomEvent("dp-target-remove",{detail:{type:i.type,id:i.itemId},bubbles:!0,composed:!0}))}render(){return w`
      <div class="context-form-field">
        <label class="context-form-label">${this.label}</label>
        <div class="context-form-help">
          ${this.chips.length>0?this.helpText:this.emptyText}
        </div>
        ${this.chips.length>0?w`
              <div
                class="context-chip-row"
                @dp-chip-remove=${this._onChipRemove}
              >
                ${V(this.chips,t=>`${t.type}:${t.itemId}`,t=>w`
                    <annotation-chip
                      .type=${t.type}
                      .itemId=${t.itemId}
                      .icon=${t.icon}
                      .name=${t.name}
                      .secondaryText=${t.secondaryText??""}
                      .stateObj=${t.stateObj??null}
                      .hass=${this.hass}
                    ></annotation-chip>
                  `)}
              </div>
            `:Q}
      </div>
    `}}a=tt($);k=new WeakMap;T=new WeakMap;S=new WeakMap;O=new WeakMap;C=new WeakMap;x(a,4,"chips",N,c,k);x(a,4,"hass",D,c,T);x(a,4,"label",F,c,S);x(a,4,"helpText",j,c,O);x(a,4,"emptyText",R,c,C);it(a,c);at(c,"styles",X);customElements.define("annotation-chip-row",c);
