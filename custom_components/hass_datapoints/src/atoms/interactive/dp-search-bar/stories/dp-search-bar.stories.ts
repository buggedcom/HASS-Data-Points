import { html } from "lit";
import "./dp-search-bar";

export default {
  title: "Atoms/Interactive/Search Bar",
  component: "dp-search-bar",
};

export const Empty = {
  render: () => html`
    <dp-search-bar .placeholder=${"Search records..."}></dp-search-bar>
  `,
};

export const WithQuery = {
  render: () => html`
    <dp-search-bar .query=${"temperature"} .placeholder=${"Search records..."}></dp-search-bar>
  `,
};
