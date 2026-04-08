import{i as J,A as K,b as L,g as Q}from"./iframe-maWesKjk.js";import{n as b}from"./property-DyW-YDBW.js";const R=J`
  :host {
    display: block;
  }

  .feedback {
    font-size: 0.82em;
    margin-top: var(--dp-feedback-margin-top, 8px);
    padding: var(--dp-feedback-padding, 6px 10px);
    border-radius: var(--dp-feedback-radius, 6px);
    display: none;
  }

  .feedback.visible {
    display: block;
  }

  .feedback.ok {
    background: rgba(76, 175, 80, 0.12);
    color: var(--success-color, #4caf50);
  }

  .feedback.err {
    background: rgba(244, 67, 54, 0.12);
    color: var(--error-color, #f44336);
  }
`;var U=Object.create,W=Object.defineProperty,V=Object.getOwnPropertyDescriptor,$=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),h=e=>{throw TypeError(e)},C=(e,t,r)=>t in e?W(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,X=e=>[,,,U(e?.[$("metadata")]??null)],E=["class","method","getter","setter","accessor","field","value","get","set"],f=e=>e!==void 0&&typeof e!="function"?h("Function expected"):e,Y=(e,t,r,s,i)=>({kind:E[e],name:t,metadata:s,addInitializer:d=>r._?h("Already initialized"):i.push(f(d||null))}),Z=(e,t)=>C(t,$("metadata"),e[3]),o=(e,t,r,s)=>{for(var i=0,d=e[t>>1],c=d&&d.length;i<c;i++)t&1?d[i].call(r):s=d[i].call(r,s);return s},u=(e,t,r,s,i,d)=>{for(var c,n,M,v,g,P=t&7,G=!1,N=!1,x=e.length+1,T=E[P+5],j=e[x-1]=[],q=e[x]||(e[x]=[]),l=(i=i.prototype,V({get[r](){return te(this,d)},set[r](_){return re(this,d,_)}},r)),y=s.length-1;y>=0;y--)v=Y(P,r,M={},e[3],q),v.static=G,v.private=N,g=v.access={has:_=>r in _},g.get=_=>_[r],g.set=(_,H)=>_[r]=H,n=(0,s[y])({get:l.get,set:l.set},v),M._=1,n===void 0?f(n)&&(l[T]=n):typeof n!="object"||n===null?h("Object expected"):(f(c=n.get)&&(l.get=c),f(c=n.set)&&(l.set=c),f(c=n.init)&&j.unshift(c));return l&&W(i,r,l),i},ee=(e,t,r)=>C(e,t+"",r),F=(e,t,r)=>t.has(e)||h("Cannot "+r),te=(e,t,r)=>(F(e,t,"read from private field"),t.get(e)),k=(e,t,r)=>t.has(e)?h("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),re=(e,t,r,s)=>(F(e,t,"write to private field"),t.set(e,r),r),A,I,B,D,S,a,w,m,z,O;class p extends(S=Q,D=[b({type:String})],B=[b({type:String})],I=[b({type:Boolean})],A=[b({type:String})],S){constructor(){super(...arguments),k(this,w,o(a,8,this,"")),o(a,11,this),k(this,m,o(a,12,this,"")),o(a,15,this),k(this,z,o(a,16,this,!1)),o(a,19,this),k(this,O,o(a,20,this,"default")),o(a,23,this)}render(){return this.text?L`
      <div
        part="feedback"
        class="feedback ${this.kind} ${this.visible?"visible":""} ${this.variant}"
      >
        ${this.text}
      </div>
    `:K}}a=X(S);w=new WeakMap;m=new WeakMap;z=new WeakMap;O=new WeakMap;u(a,4,"kind",D,p,w);u(a,4,"text",B,p,m);u(a,4,"visible",I,p,z);u(a,4,"variant",A,p,O);Z(a,p);ee(p,"styles",R);customElements.define("feedback-banner",p);
