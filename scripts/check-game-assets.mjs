import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = fileURLToPath(new URL("../", import.meta.url));
const tracked = execFileSync("git", ["ls-files", "-z"], {
	cwd: workspaceRoot,
	encoding: "utf8",
})
	.split("\0")
	.filter(Boolean)
	.map((path) => path.replace(/\\/g, "/"));

const rasterExtensions = new Set([".png", ".webp", ".jpg", ".jpeg", ".tga", ".dds"]);
const rasters = tracked.filter((path) => rasterExtensions.has(extname(path).toLowerCase()));
const allowedRaster = (path) =>
	path.startsWith("src-tauri/icons/") || path.startsWith("tests/e2e/snapshots/");
const unexpectedRaster = rasters.filter((path) => !allowedRaster(path));
const retiredLegacyRoots = [
	"assets/",
	"cmake/",
	"emscripten/",
	"ficsit-companion/",
	"spikes/rewrite/",
];
const retiredLegacyFiles = tracked.filter((path) =>
	retiredLegacyRoots.some((root) => path.startsWith(root)),
);

const violations = [];
if (retiredLegacyFiles.length > 0) {
	violations.push(`Retired upstream files returned:\n${retiredLegacyFiles.join("\n")}`);
}
if (unexpectedRaster.length > 0) {
	violations.push(`Unexpected tracked raster assets:\n${unexpectedRaster.join("\n")}`);
}

const sourceFiles = tracked.filter(
	(path) =>
		(path.startsWith("apps/") ||
			path.startsWith("packages/") ||
			path.startsWith("src-tauri/") ||
			path.startsWith(".github/workflows/")) &&
		[".ts", ".tsx", ".js", ".mjs", ".rs", ".json", ".yaml", ".yml", ".toml"].includes(
			extname(path).toLowerCase(),
		),
);
for (const path of sourceFiles) {
	const text = await readFile(join(workspaceRoot, path), "utf8");
	if (/assets[\\/]icons|assets[\\/]satisfactory\.json/i.test(text)) {
		violations.push(`${path} references quarantined upstream game assets.`);
	}
}

const fallbackNames = [
	"building.svg",
	"material-fluid.svg",
	"material-solid.svg",
	"recipe.svg",
	"unknown.svg",
];
for (const name of fallbackNames) {
	const path = join(workspaceRoot, "apps", "desktop-ui", "public", "fallback-icons", name);
	const svg = await readFile(path, "utf8");
	if (/<(?:image|script|foreignObject)\b|\bhref\s*=/i.test(svg)) {
		violations.push(`Generic fallback ${name} embeds an external or executable resource.`);
	}
}

if (violations.length > 0) {
	console.error(`Game-asset policy violations:\n${violations.join("\n")}`);
	process.exitCode = 1;
} else {
	console.log(
		"Game-asset policy verified: bundled upstream artwork is absent and application/release inputs are generic-only.",
	);
}
