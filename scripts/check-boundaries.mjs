import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = fileURLToPath(new URL("../", import.meta.url));
const rules = [
	{
		packageName: "domain",
		forbidden: ["react", "@xyflow/react", "@tauri-apps/"],
	},
	{
		packageName: "game-data",
		forbidden: ["react", "@xyflow/react", "@tauri-apps/"],
	},
	{
		packageName: "calculation",
		forbidden: ["react", "@xyflow/react", "@tauri-apps/"],
	},
];

async function sourceFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await sourceFiles(path)));
		else if ([".ts", ".tsx"].includes(extname(entry.name))) files.push(path);
	}
	return files;
}

const violations = [];
for (const rule of rules) {
	const directory = join(workspaceRoot, "packages", rule.packageName, "src");
	for (const file of await sourceFiles(directory)) {
		const source = await readFile(file, "utf8");
		for (const dependency of rule.forbidden) {
			if (source.includes(`from "${dependency}`) || source.includes(`from '${dependency}`)) {
				violations.push(`${relative(workspaceRoot, file)} -> ${dependency}`);
			}
		}
	}
}

if (violations.length > 0) {
	console.error(`Package boundary violations:\n${violations.join("\n")}`);
	process.exitCode = 1;
} else {
	console.log("Package boundaries verified.");
}
