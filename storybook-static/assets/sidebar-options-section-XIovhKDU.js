import{i as K,A as L,b as z,g as Q}from"./iframe-maWesKjk.js";import{n as u}from"./property-DyW-YDBW.js";import"./sidebar-section-header-CDFFctyZ.js";const R=K`
  :host {
    display: block;
    --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
    --dp-spacing-sm: var(--spacing, 8px);
  }

  .section {
    display: grid;
    gap: var(--dp-spacing-sm);
  }
`;var U=Object.create,C=Object.defineProperty,V=Object.getOwnPropertyDescriptor,M=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),g=e=>{throw TypeError(e)},W=(e,t,i)=>t in e?C(e,t,{enumerable:!0,configurable:!0,writable:!0,value:i}):e[t]=i,X=e=>[,,,U(e?.[M("metadata")]??null)],A=["class","method","getter","setter","accessor","field","value","get","set"],v=e=>e!==void 0&&typeof e!="function"?g("Function expected"):e,Y=(e,t,i,a,r)=>({kind:A[e],name:t,metadata:a,addInitializer:o=>i._?g("Already initialized"):r.push(v(o||null))}),Z=(e,t)=>W(t,M("metadata"),e[3]),p=(e,t,i,a)=>{for(var r=0,o=e[t>>1],l=o&&o.length;r<l;r++)t&1?o[r].call(i):a=o[r].call(i,a);return a},f=(e,t,i,a,r,o)=>{for(var l,n,E,h,y,P=t&7,G=!1,N=!1,S=e.length+1,j=A[P+5],q=e[S-1]=[],H=e[S]||(e[S]=[]),c=(r=r.prototype,V({get[i](){return te(this,o)},set[i](d){return ie(this,o,d)}},i)),w=a.length-1;w>=0;w--)h=Y(P,i,E={},e[3],H),h.static=G,h.private=N,y=h.access={has:d=>i in d},y.get=d=>d[i],y.set=(d,J)=>d[i]=J,n=(0,a[w])({get:c.get,set:c.set},h),E._=1,n===void 0?v(n)&&(c[j]=n):typeof n!="object"||n===null?g("Object expected"):(v(l=n.get)&&(c.get=l),v(l=n.set)&&(c.set=l),v(l=n.init)&&q.unshift(l));return c&&C(r,i,c),r},ee=(e,t,i)=>W(e,t+"",i),F=(e,t,i)=>t.has(e)||g("Cannot "+i),te=(e,t,i)=>(F(e,t,"read from private field"),t.get(e)),b=(e,t,i)=>t.has(e)?g("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,i),ie=(e,t,i,a)=>(F(e,t,"write to private field"),t.set(e,i),i),I,T,B,D,k,s,x,m,O,$;class _ extends(k=Q,D=[u({type:String})],B=[u({type:String})],T=[u({type:Boolean})],I=[u({type:Boolean})],k){constructor(){super(...arguments),b(this,x,p(s,8,this,"")),p(s,11,this),b(this,m,p(s,12,this,"")),p(s,15,this),b(this,O,p(s,16,this,!1)),p(s,19,this),b(this,$,p(s,20,this,!0)),p(s,23,this)}_onToggle(t){t.stopPropagation(),this.open=!this.open,this.dispatchEvent(new CustomEvent("dp-section-toggle",{detail:{open:this.open},bubbles:!0,composed:!0}))}render(){return z`
      <div class="section">
        <sidebar-section-header
          .title=${this.title}
          .subtitle=${this.subtitle}
          .collapsible=${this.collapsible}
          .open=${this.open}
          @dp-section-toggle=${this._onToggle}
        ></sidebar-section-header>
        ${this.collapsible&&!this.open?L:z`<slot></slot>`}
      </div>
    `}}s=X(k);x=new WeakMap;m=new WeakMap;O=new WeakMap;$=new WeakMap;f(s,4,"title",D,_,x);f(s,4,"subtitle",B,_,m);f(s,4,"collapsible",T,_,O);f(s,4,"open",I,_,$);Z(s,_);ee(_,"styles",R);customElements.define("sidebar-options-section",_);
