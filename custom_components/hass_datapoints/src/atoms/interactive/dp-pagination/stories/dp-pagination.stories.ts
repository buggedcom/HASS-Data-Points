import { html } from "lit";
import "../dp-pagination";

export default {
  title: "Atoms/Interactive/Pagination",
  component: "dp-pagination",
};

export const FirstPage = {
  render: () => html`
    <dp-pagination .page=${0} .totalPages=${5} .totalItems=${50} .label=${"records"}></dp-pagination>
  `,
};

export const MiddlePage = {
  render: () => html`
    <dp-pagination .page=${2} .totalPages=${5} .totalItems=${50} .label=${"records"}></dp-pagination>
  `,
};

export const LastPage = {
  render: () => html`
    <dp-pagination .page=${4} .totalPages=${5} .totalItems=${50} .label=${"records"}></dp-pagination>
  `,
};

export const SinglePage = {
  render: () => html`
    <dp-pagination .page=${0} .totalPages=${1} .totalItems=${3} .label=${"events"}></dp-pagination>
  `,
};
