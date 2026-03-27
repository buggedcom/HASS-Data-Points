import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const repoRoot = process.cwd();

export function repoPath(...parts) {
  return path.join(repoRoot, ...parts);
}

/**
 * Strips ES module syntax so the source can run in a vm.runInContext sandbox.
 * Scripts are loaded in dependency order, so imported symbols are already
 * present in the sandbox by the time the importing script runs.
 */
function stripEsModuleSyntax(source: string): string {
  // Remove import declarations (single- and multi-line: import … from "…";)
  let result = source.replace(/^import\b[\s\S]*?\bfrom\s+['"][^'"]+['"]\s*;?\n?/gm, "");

  // Strip the 'export' keyword from named declarations
  result = result.replace(/\bexport\s+((?:async\s+)?(?:function\*?|const|let|var|class))\b/g, "$1");

  // Strip standalone re-export blocks: export { … };
  result = result.replace(/^export\s*\{[^}]*\}\s*;?\n?/gm, "");

  return result;
}

export function loadLegacyScripts(scriptPaths, exportNames, context = {}) {
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    Date,
    Math,
    JSON,
    Map,
    Set,
    URL,
    URLSearchParams,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    encodeURIComponent,
    decodeURIComponent,
    CustomEvent,
    ...context,
  };

  vm.createContext(sandbox);

  for (const scriptPath of scriptPaths) {
    const raw = fs.readFileSync(scriptPath, "utf8");
    const source = stripEsModuleSyntax(raw);
    vm.runInContext(source, sandbox, { filename: scriptPath });
  }

  const exportAssignments = exportNames
    .map((name) => `${name}: typeof ${name} !== "undefined" ? ${name} : undefined`)
    .join(", ");

  vm.runInContext(`module.exports = { ${exportAssignments} };`, sandbox);
  return sandbox.module.exports;
}
