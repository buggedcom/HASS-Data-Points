import{i as L,A as P,b as m,g as Q}from"./iframe-maWesKjk.js";import{n as u}from"./property-DyW-YDBW.js";const R=L`
  :host {
    display: block;
  }
  .sidebar-section-header {
    display: grid;
    gap: var(--dp-spacing-xs);
  }
  .sidebar-section-header.is-collapsible {
    cursor: pointer;
    user-select: none;
  }
  .sidebar-section-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
  }
  .sidebar-section-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--primary-text-color);
  }
  .sidebar-section-subtitle {
    font-size: 0.82rem;
    color: var(--secondary-text-color);
  }
  .sidebar-section-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: var(--secondary-text-color);
    cursor: pointer;
    border-radius: 4px;
    flex-shrink: 0;
    transition: background-color 120ms ease;
  }
  .sidebar-section-toggle:hover,
  .sidebar-section-toggle:focus-visible {
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 8%,
      transparent
    );
  }
  .sidebar-section-toggle ha-icon {
    --mdc-icon-size: 18px;
    display: block;
    transition: transform 140ms ease;
  }
  .sidebar-section-toggle.is-open ha-icon {
    transform: rotate(180deg);
  }
`;var U=Object.create,H=Object.defineProperty,V=Object.getOwnPropertyDescriptor,M=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),g=e=>{throw TypeError(e)},T=(e,t,i)=>t in e?H(e,t,{enumerable:!0,configurable:!0,writable:!0,value:i}):e[t]=i,X=e=>[,,,U(e?.[M("metadata")]??null)],W=["class","method","getter","setter","accessor","field","value","get","set"],b=e=>e!==void 0&&typeof e!="function"?g("Function expected"):e,Y=(e,t,i,o,s)=>({kind:W[e],name:t,metadata:o,addInitializer:a=>i._?g("Already initialized"):s.push(b(a||null))}),Z=(e,t)=>T(t,M("metadata"),e[3]),c=(e,t,i,o)=>{for(var s=0,a=e[t>>1],l=a&&a.length;s<l;s++)t&1?a[s].call(i):o=a[s].call(i,o);return o},f=(e,t,i,o,s,a)=>{for(var l,n,E,_,y,O=t&7,j=!1,K=!1,x=e.length+1,G=W[O+5],N=e[x-1]=[],q=e[x]||(e[x]=[]),d=(s=s.prototype,V({get[i](){return te(this,a)},set[i](p){return ie(this,a,p)}},i)),k=o.length-1;k>=0;k--)_=Y(O,i,E={},e[3],q),_.static=j,_.private=K,y=_.access={has:p=>i in p},y.get=p=>p[i],y.set=(p,J)=>p[i]=J,n=(0,o[k])({get:d.get,set:d.set},_),E._=1,n===void 0?b(n)&&(d[G]=n):typeof n!="object"||n===null?g("Object expected"):(b(l=n.get)&&(d.get=l),b(l=n.set)&&(d.set=l),b(l=n.init)&&N.unshift(l));return d&&H(s,i,d),s},ee=(e,t,i)=>T(e,t+"",i),B=(e,t,i)=>t.has(e)||g("Cannot "+i),te=(e,t,i)=>(B(e,t,"read from private field"),t.get(e)),v=(e,t,i)=>t.has(e)?g("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,i),ie=(e,t,i,o)=>(B(e,t,"write to private field"),t.set(e,i),i),A,D,F,I,w,r,$,S,C,z;class h extends(w=Q,I=[u({type:String})],F=[u({type:String})],D=[u({type:Boolean})],A=[u({type:Boolean})],w){constructor(){super(...arguments),v(this,$,c(r,8,this,"")),c(r,11,this),v(this,S,c(r,12,this,"")),c(r,15,this),v(this,C,c(r,16,this,!1)),c(r,19,this),v(this,z,c(r,20,this,!0)),c(r,23,this)}_emitToggle(){this.dispatchEvent(new CustomEvent("dp-section-toggle",{bubbles:!0,composed:!0}))}_onHeaderClick(){this.collapsible&&this._emitToggle()}_onHeaderKeydown(t){this.collapsible&&(t.key!=="Enter"&&t.key!==" "||(t.preventDefault(),this._emitToggle()))}_onButtonClick(t){t.stopPropagation(),this._emitToggle()}render(){return m`
      <div
        class="sidebar-section-header ${this.collapsible?"is-collapsible":""}"
        role=${this.collapsible?"button":"presentation"}
        tabindex=${this.collapsible?"0":"-1"}
        aria-expanded=${this.collapsible?String(this.open):"false"}
        @click=${this._onHeaderClick}
        @keydown=${this._onHeaderKeydown}
      >
        <div class="sidebar-section-header-row">
          <div class="sidebar-section-title">${this.title}</div>
          ${this.collapsible?m`
                <button
                  type="button"
                  class="sidebar-section-toggle ${this.open?"is-open":""}"
                  aria-label="${this.open?"Collapse":"Expand"} ${this.title}"
                  aria-expanded=${this.open}
                  @click=${this._onButtonClick}
                >
                  <ha-icon icon="mdi:chevron-down"></ha-icon>
                </button>
              `:P}
        </div>
        ${this.subtitle?m`<div class="sidebar-section-subtitle">${this.subtitle}</div>`:P}
      </div>
    `}}r=X(w);$=new WeakMap;S=new WeakMap;C=new WeakMap;z=new WeakMap;f(r,4,"title",I,h,$);f(r,4,"subtitle",F,h,S);f(r,4,"collapsible",D,h,C);f(r,4,"open",A,h,z);Z(r,h);ee(h,"styles",R);customElements.define("sidebar-section-header",h);
