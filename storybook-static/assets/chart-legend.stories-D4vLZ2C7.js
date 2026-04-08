import{i as q,b as f,g as J}from"./iframe-maWesKjk.js";import{n as b}from"./property-DyW-YDBW.js";import"./legend-item-Df59h7I1.js";import"./preload-helper-PPVm8Dsz.js";const K=q`
  :host {
    display: block;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 8px;
    padding: 4px var(--dp-spacing-lg, 16px) 8px;
    overflow-y: auto;
    max-height: calc((30px * 3) + 16px);
  }
`;var Q=Object.create,E=Object.defineProperty,U=Object.getOwnPropertyDescriptor,H=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),g=e=>{throw TypeError(e)},W=(e,t,r)=>t in e?E(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,V=e=>[,,,Q(e?.[H("metadata")]??null)],z=["class","method","getter","setter","accessor","field","value","get","set"],_=e=>e!==void 0&&typeof e!="function"?g("Function expected"):e,X=(e,t,r,i,n)=>({kind:z[e],name:t,metadata:i,addInitializer:a=>r._?g("Already initialized"):n.push(_(a||null))}),Y=(e,t)=>W(t,H("metadata"),e[3]),p=(e,t,r,i)=>{for(var n=0,a=e[t>>1],d=a&&a.length;n<d;n++)t&1?a[n].call(r):i=a[n].call(r,i);return i},I=(e,t,r,i,n,a)=>{for(var d,o,k,u,w,O=t&7,L=!1,D=!1,y=e.length+1,j=z[O+5],B=e[y-1]=[],G=e[y]||(e[y]=[]),l=(n=n.prototype,U({get[r](){return ee(this,a)},set[r](c){return te(this,a,c)}},r)),S=i.length-1;S>=0;S--)u=X(O,r,k={},e[3],G),u.static=L,u.private=D,w=u.access={has:c=>r in c},w.get=c=>c[r],w.set=(c,N)=>c[r]=N,o=(0,i[S])({get:l.get,set:l.set},u),k._=1,o===void 0?_(o)&&(l[j]=o):typeof o!="object"||o===null?g("Object expected"):(_(d=o.get)&&(l.get=d),_(d=o.set)&&(l.set=d),_(d=o.init)&&B.unshift(d));return l&&E(n,r,l),n},Z=(e,t,r)=>W(e,t+"",r),M=(e,t,r)=>t.has(e)||g("Cannot "+r),ee=(e,t,r)=>(M(e,t,"read from private field"),t.get(e)),x=(e,t,r)=>t.has(e)?g("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),te=(e,t,r,i)=>(M(e,t,"write to private field"),t.set(e,r),r),R,A,F,$,s,C,P,T;class h extends($=J,F=[b({type:Array})],A=[b({type:Object})],R=[b({type:Boolean,attribute:"wrap-rows"})],$){constructor(){super(...arguments),x(this,C,p(s,8,this,[])),p(s,11,this),x(this,P,p(s,12,this,new Set)),p(s,15,this),x(this,T,p(s,16,this,!1)),p(s,19,this)}_onToggle(t,r){this.dispatchEvent(new CustomEvent("dp-series-toggle",{detail:{entityId:t,visible:r.detail.pressed},bubbles:!0,composed:!0}))}render(){return f`
      <div class="legend ${this.wrapRows?"wrap-rows":""}">
        ${this.series.map(t=>f`
            <legend-item
              .label=${t.label}
              .color=${t.color}
              .unit=${t.unit??""}
              .pressed=${!this.hiddenSeries.has(t.entityId)}
              .opacity=${1}
              @dp-legend-toggle=${r=>this._onToggle(t.entityId,r)}
            ></legend-item>
          `)}
      </div>
    `}}s=V($);C=new WeakMap;P=new WeakMap;T=new WeakMap;I(s,4,"series",F,h,C);I(s,4,"hiddenSeries",A,h,P);I(s,4,"wrapRows",R,h,T);Y(s,h);Z(h,"styles",K);customElements.define("chart-legend",h);const ae={title:"Molecules/Chart Legend",component:"chart-legend"},m={render:()=>f`
    <chart-legend
      .series=${[{entityId:"sensor.temp",label:"Temperature",color:"#2196f3",unit:"°C"},{entityId:"sensor.hum",label:"Humidity",color:"#4caf50",unit:"%"}]}
      .hiddenSeries=${new Set}
    ></chart-legend>
  `},v={render:()=>f`
    <chart-legend
      .series=${[{entityId:"sensor.temp",label:"Temperature",color:"#2196f3",unit:"°C"},{entityId:"sensor.hum",label:"Humidity",color:"#4caf50",unit:"%"},{entityId:"sensor.pressure",label:"Pressure",color:"#ff9800",unit:"hPa"}]}
      .hiddenSeries=${new Set(["sensor.hum"])}
    ></chart-legend>
  `};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <chart-legend
      .series=\${[{
    entityId: "sensor.temp",
    label: "Temperature",
    color: "#2196f3",
    unit: "°C"
  }, {
    entityId: "sensor.hum",
    label: "Humidity",
    color: "#4caf50",
    unit: "%"
  }]}
      .hiddenSeries=\${new Set()}
    ></chart-legend>
  \`
}`,...m.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <chart-legend
      .series=\${[{
    entityId: "sensor.temp",
    label: "Temperature",
    color: "#2196f3",
    unit: "°C"
  }, {
    entityId: "sensor.hum",
    label: "Humidity",
    color: "#4caf50",
    unit: "%"
  }, {
    entityId: "sensor.pressure",
    label: "Pressure",
    color: "#ff9800",
    unit: "hPa"
  }]}
      .hiddenSeries=\${new Set(["sensor.hum"])}
    ></chart-legend>
  \`
}`,...v.parameters?.docs?.source}}};const oe=["TwoSeries","WithHidden"];export{m as TwoSeries,v as WithHidden,oe as __namedExportsOrder,ae as default};
