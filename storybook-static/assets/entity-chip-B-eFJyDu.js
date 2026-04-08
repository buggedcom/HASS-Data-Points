import{i as J,b as C,g as K}from"./iframe-maWesKjk.js";import{n as u}from"./property-DyW-YDBW.js";const L=J`
  :host {
    display: inline-flex;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.78rem;
    background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
    color: var(--primary-text-color);
    white-space: nowrap;
  }
  .remove {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0 2px;
    font-size: 0.9rem;
    color: var(--secondary-text-color);
    line-height: 1;
  }
  .remove:hover {
    color: var(--error-color, #f44336);
  }
`;var Q=Object.create,M=Object.defineProperty,U=Object.getOwnPropertyDescriptor,P=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),m=e=>{throw TypeError(e)},W=(e,t,r)=>t in e?M(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,V=e=>[,,,Q(e?.[P("metadata")]??null)],$=["class","method","getter","setter","accessor","field","value","get","set"],v=e=>e!==void 0&&typeof e!="function"?m("Function expected"):e,X=(e,t,r,s,a)=>({kind:$[e],name:t,metadata:s,addInitializer:o=>r._?m("Already initialized"):a.push(v(o||null))}),Y=(e,t)=>W(t,P("metadata"),e[3]),d=(e,t,r,s)=>{for(var a=0,o=e[t>>1],c=o&&o.length;a<c;a++)t&1?o[a].call(r):s=o[a].call(r,s);return s},g=(e,t,r,s,a,o)=>{for(var c,n,E,_,f,O=t&7,j=!1,B=!1,b=e.length+1,G=$[O+5],T=e[b-1]=[],q=e[b]||(e[b]=[]),l=(a=a.prototype,U({get[r](){return ee(this,o)},set[r](p){return te(this,o,p)}},r)),x=s.length-1;x>=0;x--)_=X(O,r,E={},e[3],q),_.static=j,_.private=B,f=_.access={has:p=>r in p},f.get=p=>p[r],f.set=(p,H)=>p[r]=H,n=(0,s[x])({get:l.get,set:l.set},_),E._=1,n===void 0?v(n)&&(l[G]=n):typeof n!="object"||n===null?m("Object expected"):(v(c=n.get)&&(l.get=c),v(c=n.set)&&(l.set=c),v(c=n.init)&&T.unshift(c));return l&&M(a,r,l),a},Z=(e,t,r)=>W(e,t+"",r),F=(e,t,r)=>t.has(e)||m("Cannot "+r),ee=(e,t,r)=>(F(e,t,"read from private field"),t.get(e)),y=(e,t,r)=>t.has(e)?m("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),te=(e,t,r,s)=>(F(e,t,"write to private field"),t.set(e,r),r),N,R,A,D,I,i,w,k,S,z;class h extends(I=K,D=[u({type:String})],A=[u({type:String,attribute:"item-id"})],R=[u({type:Object})],N=[u({type:Boolean})],I){constructor(){super(...arguments),y(this,w,d(i,8,this,"entity")),d(i,11,this),y(this,k,d(i,12,this,"")),d(i,15,this),y(this,S,d(i,16,this,null)),d(i,19,this),y(this,z,d(i,20,this,!1)),d(i,23,this)}_getName(){if(!this.hass||!this.itemId)return this.itemId||"";switch(this.type){case"entity":return this.hass.states?.[this.itemId]?.attributes?.friendly_name??this.itemId;case"device":return this.hass.devices?.[this.itemId]?.name??this.itemId;case"area":return this.hass.areas?.[this.itemId]?.name??this.itemId;default:return this.itemId}}_onRemove(){this.dispatchEvent(new CustomEvent("dp-chip-remove",{detail:{type:this.type,itemId:this.itemId},bubbles:!0,composed:!0}))}render(){return C`
      <span class="chip">
        ${this._getName()}
        ${this.removable?C`<button
              class="remove"
              data-action="remove"
              @click=${this._onRemove}
              aria-label="Remove"
            ></button>`:""}
      </span>
    `}}i=V(I);w=new WeakMap;k=new WeakMap;S=new WeakMap;z=new WeakMap;g(i,4,"type",D,h,w);g(i,4,"itemId",A,h,k);g(i,4,"hass",R,h,S);g(i,4,"removable",N,h,z);Y(i,h);Z(h,"styles",L);customElements.define("entity-chip",h);
