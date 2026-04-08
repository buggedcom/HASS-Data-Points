import{i as a,g as i,b as p}from"./iframe-maWesKjk.js";const l=a`
  :host {
    display: block;
    --dp-spacing-sm: var(--spacing, 8px);
  }

  .subopts {
    padding-left: calc(var(--spacing, 8px) * 1.5);
    display: grid;
    gap: var(--dp-spacing-sm);
    justify-items: start;
    border-left: 3px solid var(--primary-color);
    margin-left: 5px;
  }
`;var o=Object.defineProperty,d=(s,r,e)=>r in s?o(s,r,{enumerable:!0,configurable:!0,writable:!0,value:e}):s[r]=e,n=(s,r,e)=>d(s,r+"",e);class t extends i{render(){return p`<div class="subopts"><slot></slot></div>`}}n(t,"styles",l);customElements.define("analysis-method-subopts",t);
