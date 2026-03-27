import fs from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import ts from "typescript";

function isRelativeSpecifier(specifier) {
  return specifier.startsWith("./") || specifier.startsWith("../");
}

function hasKnownExtension(specifier) {
  return [".ts", ".js", ".mjs", ".cjs", ".json"].some((extension) => specifier.endsWith(extension));
}

function resolveCandidatePaths(specifier, parentURL) {
  if (!isRelativeSpecifier(specifier) || hasKnownExtension(specifier) || parentURL === undefined) {
    return [];
  }

  const parentPath = fileURLToPath(parentURL);
  const basePath = path.resolve(path.dirname(parentPath), specifier);

  return [
    `${basePath}.ts`,
    `${basePath}.js`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.js"),
  ];
}

export async function resolve(specifier, context, defaultResolve) {
  try {
    return await defaultResolve(specifier, context, defaultResolve);
  } catch (error) {
    const candidatePaths = resolveCandidatePaths(specifier, context.parentURL);

    for (const candidatePath of candidatePaths) {
      if (fs.existsSync(candidatePath)) {
        return {
          url: pathToFileURL(candidatePath).href,
          shortCircuit: true,
        };
      }
    }

    throw error;
  }
}

export async function load(url, context, defaultLoad) {
  if (url.endsWith(".ts")) {
    const sourceText = await readFile(new URL(url), "utf8");
    const transpiled = ts.transpileModule(sourceText, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        esModuleInterop: true,
        sourceMap: false,
        inlineSourceMap: true,
      },
      fileName: fileURLToPath(url),
    });

    return {
      format: "module",
      source: transpiled.outputText,
      shortCircuit: true,
    };
  }

  return defaultLoad(url, context, defaultLoad);
}
