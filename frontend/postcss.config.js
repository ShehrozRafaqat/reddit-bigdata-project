import fs from "node:fs";
import path from "node:path";

const hasModule = (name) =>
  fs.existsSync(path.join(process.cwd(), "node_modules", name));

const plugins = {};

if (hasModule("tailwindcss")) {
  plugins.tailwindcss = {};
}

if (hasModule("autoprefixer")) {
  plugins.autoprefixer = {};
}

export default { plugins };
