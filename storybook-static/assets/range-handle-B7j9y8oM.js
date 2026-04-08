import{i as R,b as U,g as X}from"./iframe-maWesKjk.js";import{n as w}from"./property-DyW-YDBW.js";const G=R`
  :host {
    position: absolute;
    top: 26px;
    left: 0;
    transform: translate(-50%, -50%);
    display: block;
    width: 20px;
    height: 20px;
  }

  .handle {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid var(--card-background-color, #fff);
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 84%,
      transparent
    );
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
    padding: 0;
    cursor: ew-resize;
    touch-action: none;
  }

  .handle:focus-visible {
    outline: 3px solid
      color-mix(in srgb, var(--primary-color, #03a9f4) 24%, transparent);
    outline-offset: 2px;
  }

  @keyframes dp-live-breathe {
    0%,
    100% {
      box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.18),
        0 0 0 0 rgba(239, 83, 80, 0);
    }
    50% {
      box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.18),
        0 0 0 5px rgba(239, 83, 80, 0.2);
    }
  }

  .handle.is-live {
    background: #ef5350;
    animation: dp-live-breathe 3s ease-in-out infinite;
  }
`;var T=Object.create,$=Object.defineProperty,j=Object.getOwnPropertyDescriptor,S=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),_=e=>{throw TypeError(e)},z=(e,t,r)=>t in e?$(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,q=e=>[,,,T(e?.[S("metadata")]??null)],A=["class","method","getter","setter","accessor","field","value","get","set"],v=e=>e!==void 0&&typeof e!="function"?_("Function expected"):e,J=(e,t,r,n,o)=>({kind:A[e],name:t,metadata:n,addInitializer:a=>r._?_("Already initialized"):o.push(v(a||null))}),Q=(e,t)=>z(t,S("metadata"),e[3]),c=(e,t,r,n)=>{for(var o=0,a=e[t>>1],l=a&&a.length;o<l;o++)t&1?a[o].call(r):n=a[o].call(r,n);return n},m=(e,t,r,n,o,a)=>{for(var l,s,C,u,b,D=t&7,M=!1,W=!1,f=e.length+1,B=A[D+5],L=e[f-1]=[],H=e[f]||(e[f]=[]),d=(o=o.prototype,j({get[r](){return Y(this,a)},set[r](p){return Z(this,a,p)}},r)),g=n.length-1;g>=0;g--)u=J(D,r,C={},e[3],H),u.static=M,u.private=W,b=u.access={has:p=>r in p},b.get=p=>p[r],b.set=(p,N)=>p[r]=N,s=(0,n[g])({get:d.get,set:d.set},u),C._=1,s===void 0?v(s)&&(d[B]=s):typeof s!="object"||s===null?_("Object expected"):(v(l=s.get)&&(d.get=l),v(l=s.set)&&(d.set=l),v(l=s.init)&&L.unshift(l));return d&&$(o,r,d),o},V=(e,t,r)=>z(e,t+"",r),K=(e,t,r)=>t.has(e)||_("Cannot "+r),Y=(e,t,r)=>(K(e,t,"read from private field"),t.get(e)),y=(e,t,r)=>t.has(e)?_("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),Z=(e,t,r,n)=>(K(e,t,"write to private field"),t.set(e,r),r),O,F,I,x,i,E,k,P;class h extends(x=X,I=[w({type:Number})],F=[w({type:String})],O=[w({type:Boolean})],x){constructor(){super(...arguments),y(this,E,c(i,8,this,0)),c(i,11,this),y(this,k,c(i,12,this,"")),c(i,15,this),y(this,P,c(i,16,this,!1)),c(i,19,this)}updated(t){t.has("position")&&(this.style.left=`${this.position}%`)}_onPointerDown(t){t.preventDefault(),this.dispatchEvent(new CustomEvent("dp-handle-drag-start",{detail:{pointerId:t.pointerId,clientX:t.clientX},bubbles:!0,composed:!0}))}_onKeyDown(t){["ArrowLeft","ArrowRight","ArrowDown","ArrowUp","PageDown","PageUp","Home","End"].includes(t.key)&&(t.preventDefault(),this.dispatchEvent(new CustomEvent("dp-handle-keydown",{detail:{key:t.key,shiftKey:t.shiftKey},bubbles:!0,composed:!0})))}_onPointerEnter(){this.dispatchEvent(new CustomEvent("dp-handle-hover",{bubbles:!0,composed:!0}))}_onPointerLeave(){this.dispatchEvent(new CustomEvent("dp-handle-leave",{bubbles:!0,composed:!0}))}_onFocus(){this.dispatchEvent(new CustomEvent("dp-handle-focus",{bubbles:!0,composed:!0}))}_onBlur(){this.dispatchEvent(new CustomEvent("dp-handle-blur",{bubbles:!0,composed:!0}))}render(){return U`
      <button
        type="button"
        class="handle ${this.live?"is-live":""}"
        aria-label="${this.label}"
        @pointerdown=${this._onPointerDown}
        @keydown=${this._onKeyDown}
        @pointerenter=${this._onPointerEnter}
        @pointerleave=${this._onPointerLeave}
        @focus=${this._onFocus}
        @blur=${this._onBlur}
      ></button>
    `}}i=q(x);E=new WeakMap;k=new WeakMap;P=new WeakMap;m(i,4,"position",I,h,E);m(i,4,"label",F,h,k);m(i,4,"live",O,h,P);Q(i,h);V(h,"styles",G);customElements.define("range-handle",h);
