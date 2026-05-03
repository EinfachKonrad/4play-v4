import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const replacements = [
  {
    file: "node_modules/next-auth/lib/env.js",
    from: 'from "next/server"',
    to: 'from "next/server.js"',
  },
  {
    file: "node_modules/next-auth/lib/index.js",
    from: 'from "next/headers"',
    to: 'from "next/headers.js"',
  },
  {
    file: "node_modules/next-auth/lib/index.js",
    from: 'from "next/server"',
    to: 'from "next/server.js"',
  },
  {
    file: "node_modules/next-auth/lib/actions.js",
    from: 'from "next/headers"',
    to: 'from "next/headers.js"',
  },
  {
    file: "node_modules/next-auth/lib/actions.js",
    from: 'from "next/navigation"',
    to: 'from "next/navigation.js"',
  },
];

let changed = 0;

for (const item of replacements) {
  const fullPath = join(process.cwd(), item.file);

  if (!existsSync(fullPath)) {
    continue;
  }

  const content = readFileSync(fullPath, "utf8");

  if (!content.includes(item.from)) {
    continue;
  }

  const nextContent = content.replace(item.from, item.to);

  if (nextContent !== content) {
    writeFileSync(fullPath, nextContent, "utf8");
    changed += 1;
  }
}

if (changed > 0) {
  console.log(`[postinstall] Applied Next 16 compatibility patch to next-auth (${changed} changes).`);
} else {
  console.log("[postinstall] next-auth compatibility patch already applied or not needed.");
}
