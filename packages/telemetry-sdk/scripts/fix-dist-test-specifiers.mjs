import fs from "node:fs";
import path from "node:path";

const rootDir = new URL("../dist-test/", import.meta.url);

function shouldRewrite(specifier) {
  if (!specifier.startsWith("./") && !specifier.startsWith("../")) {
    return false;
  }

  return path.extname(specifier) === "";
}

function rewriteFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const rewritten = content.replace(
    /(from\s+["'])(\.{1,2}\/[^"']+)(["'])/g,
    (match, prefix, specifier, suffix) => {
      if (!shouldRewrite(specifier)) {
        return match;
      }

      return `${prefix}${specifier}.js${suffix}`;
    },
  );

  if (rewritten !== content) {
    fs.writeFileSync(filePath, rewritten, "utf8");
  }
}

function walk(directoryUrl) {
  const directoryPath = directoryUrl instanceof URL ? directoryUrl : new URL(directoryUrl, import.meta.url);

  for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
    const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directoryPath);

    if (entry.isDirectory()) {
      walk(entryUrl);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".js")) {
      rewriteFile(entryUrl);
    }
  }
}

walk(rootDir);
