import{i as K,A as L,b as O,g as Q}from"./iframe-maWesKjk.js";import{n as u}from"./property-DyW-YDBW.js";const R=K`
  :host {
    display: block;
    --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
    --dp-spacing-sm: var(--spacing, 8px);
    --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
    --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
  }

  .group {
    display: grid;
    gap: var(--dp-spacing-sm);
    border-radius: 6px;
  }

  .group-body {
    display: grid;
    gap: var(--dp-spacing-sm);
    padding: var(--dp-spacing-sm);
    border-left: 3px solid var(--primary-color);
    margin-left: 5px;
    padding-left: var(--dp-spacing-md);
  }

  .option {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
    color: var(--primary-text-color);
    font-size: 0.84rem;
    cursor: pointer;
  }

  .option.top {
    align-items: flex-start;
  }

  .option.is-disabled {
    opacity: 0.4;
    pointer-events: none;
  }

  .option input[type="checkbox"] {
    margin: 0;
    accent-color: var(--primary-color, #03a9f4);
    cursor: pointer;
  }

  .help-text {
    display: inline-block;
    color: var(--secondary-text-color);
    opacity: 0.8;
    padding-top: 2px;
  }
`;var U=Object.create,B=Object.defineProperty,V=Object.getOwnPropertyDescriptor,M=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),v=e=>{throw TypeError(e)},P=(e,t,a)=>t in e?B(e,t,{enumerable:!0,configurable:!0,writable:!0,value:a}):e[t]=a,X=e=>[,,,U(e?.[M("metadata")]??null)],T=["class","method","getter","setter","accessor","field","value","get","set"],_=e=>e!==void 0&&typeof e!="function"?v("Function expected"):e,Y=(e,t,a,s,r)=>({kind:T[e],name:t,metadata:s,addInitializer:o=>a._?v("Already initialized"):r.push(_(o||null))}),Z=(e,t)=>P(t,M("metadata"),e[3]),p=(e,t,a,s)=>{for(var r=0,o=e[t>>1],c=o&&o.length;r<c;r++)t&1?o[r].call(a):s=o[r].call(a,s);return s},f=(e,t,a,s,r,o)=>{for(var c,n,z,h,y,E=t&7,D=!1,G=!1,x=e.length+1,N=T[E+5],q=e[x-1]=[],H=e[x]||(e[x]=[]),l=(r=r.prototype,V({get[a](){return te(this,o)},set[a](d){return ae(this,o,d)}},a)),k=s.length-1;k>=0;k--)h=Y(E,a,z={},e[3],H),h.static=D,h.private=G,y=h.access={has:d=>a in d},y.get=d=>d[a],y.set=(d,J)=>d[a]=J,n=(0,s[k])({get:l.get,set:l.set},h),z._=1,n===void 0?_(n)&&(l[N]=n):typeof n!="object"||n===null?v("Object expected"):(_(c=n.get)&&(l.get=c),_(c=n.set)&&(l.set=c),_(c=n.init)&&q.unshift(c));return l&&B(r,a,l),r},ee=(e,t,a)=>P(e,t+"",a),W=(e,t,a)=>t.has(e)||v("Cannot "+a),te=(e,t,a)=>(W(e,t,"read from private field"),t.get(e)),b=(e,t,a)=>t.has(e)?v("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,a),ae=(e,t,a,s)=>(W(e,t,"write to private field"),t.set(e,a),a),A,F,I,j,m,i,w,C,S,$;class g extends(m=Q,j=[u({type:String})],I=[u({type:Boolean})],F=[u({type:Boolean})],A=[u({type:Boolean,attribute:"align-top"})],m){constructor(){super(...arguments),b(this,w,p(i,8,this,"")),p(i,11,this),b(this,C,p(i,12,this,!1)),p(i,15,this),b(this,S,p(i,16,this,!1)),p(i,19,this),b(this,$,p(i,20,this,!1)),p(i,23,this)}_onChange(t){const a=t.target.checked;this.checked=a,this.dispatchEvent(new CustomEvent("dp-group-change",{detail:{checked:a},bubbles:!0,composed:!0}))}render(){const t=["group",this.checked?"is-open":""].filter(Boolean).join(" "),a=["option",this.alignTop?"top":"",this.disabled?"is-disabled":""].filter(Boolean).join(" ");return O`
      <div class=${t}>
        <label class=${a}>
          <input
            type="checkbox"
            .checked=${this.checked}
            ?disabled=${this.disabled}
            @change=${this._onChange}
          />
          <span
            ><slot name="label">${this.label}</slot><slot name="hint"></slot
          ></span>
        </label>
        ${this.checked?O`
              <div class="group-body">
                <slot></slot>
              </div>
            `:L}
      </div>
    `}}i=X(m);w=new WeakMap;C=new WeakMap;S=new WeakMap;$=new WeakMap;f(i,4,"label",j,g,w);f(i,4,"checked",I,g,C);f(i,4,"disabled",F,g,S);f(i,4,"alignTop",A,g,$);Z(i,g);ee(g,"styles",R);customElements.define("analysis-group",g);
