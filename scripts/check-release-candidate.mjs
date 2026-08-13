import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const tracked = execFileSync(
	"git",
	["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
	{
		cwd: root,
		encoding: "utf8",
	},
)
	.split("\0")
	.filter(Boolean)
	.map((path) => path.replaceAll("\\", "/"));
const errors = [];

const requiredDocs = [
	"docs/user-guide/GETTING-STARTED.md",
	"docs/user-guide/GAME-DATA-AND-ICONS.md",
	"docs/user-guide/USING-THE-PLANNER.md",
	"docs/user-guide/BACKUP-AND-RECOVERY.md",
	"docs/user-guide/TROUBLESHOOTING.md",
	"docs/release-candidate/KNOWN-LIMITATIONS.md",
	"docs/release-candidate/CREDITS.md",
	"docs/release-candidate/ROLLBACK.md",
	"docs/release-candidate/RELEASE-NOTES-v1.0.4.md",
	"docs/release-candidate/UAT.md",
	"docs/release-candidate/ARTIFACT-MANIFEST.md",
];
for (const path of [".github/ISSUE_TEMPLATE/bug_report.yml", ".github/ISSUE_TEMPLATE/config.yml"]) {
	if (!existsSync(resolve(root, path))) errors.push(`Required support route is missing: ${path}`);
}
for (const path of requiredDocs) {
	if (!existsSync(resolve(root, path)))
		errors.push(`Required stable-release document is missing: ${path}`);
}

const markdownFiles = tracked.filter((path) => extname(path).toLowerCase() === ".md");
for (const path of markdownFiles) {
	const source = readFileSync(resolve(root, path), "utf8");
	for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
		const target = match[1]?.trim().replace(/^<|>$/g, "");
		if (!target || /^(?:https?:|mailto:|#)/i.test(target)) continue;
		const fileTarget = decodeURIComponent(target.split("#")[0] ?? "");
		if (!fileTarget || existsSync(resolve(root, path, "..", fileTarget))) continue;
		errors.push(`${path} has a broken local Markdown link: ${target}`);
	}
}

const exampleFiles = tracked
	.filter((path) => /^examples\/[^/]+\.satisplan\.json$/.test(path))
	.sort();
if (exampleFiles.length !== 3)
	errors.push(`Expected exactly 3 versioned example plans, found ${exampleFiles.length}.`);
for (const path of exampleFiles) {
	const source = readFileSync(resolve(root, path), "utf8");
	const plan = JSON.parse(source);
	if (plan.schemaVersion !== 6) errors.push(`${path} is not schema v6.`);
	if (plan.gameDataSnapshotId !== "fallback-graph-catalog-v3") {
		errors.push(`${path} does not use the redistribution-safe fallback catalog.`);
	}
	if (plan.gameProfile?.version !== "1.2" || plan.userMetadata?.satisPlannerVersion !== "1.0.4") {
		errors.push(`${path} is missing Satisfactory 1.2 / SatisPlanner 1.0.4 provenance.`);
	}
	if (/communityresources|[a-z]:\\users\\|steamapps|\.pak\b|\.sav\b/i.test(source)) {
		errors.push(`${path} contains a game source, personal path or forbidden asset reference.`);
	}
}

for (let slice = 0; slice <= 14; slice += 1) {
	const prefix = String(slice).padStart(2, "0");
	const path = tracked.find((candidate) =>
		candidate.startsWith(`SatisPlanner-development-plan/slices/SLICE-${prefix}-`),
	);
	if (!path) {
		errors.push(`Slice ${prefix} plan is missing.`);
		continue;
	}
	const record = readFileSync(resolve(root, path), "utf8").split("## Delivery Record")[1] ?? "";
	for (const field of [
		"Branch",
		"Closing SHA",
		"Remote SHA",
		"Tag",
		"GitHub Release URL",
		"CI",
		"Codex notification",
		"User approval",
		"Tarih",
	]) {
		if (!new RegExp(`^- ${field}:\\s*\\S`, "m").test(record))
			errors.push(`${path} has an empty ${field}.`);
	}
	if (/User approval:.*(?:bekleniyor|pending)/i.test(record))
		errors.push(`${path} still has pending user approval.`);
}

const productSurfaces = [
	"README.md",
	"package.json",
	"apps/desktop-ui/src/App.tsx",
	"src-tauri/tauri.conf.json",
	"docs/user-guide/GETTING-STARTED.md",
];
for (const path of productSurfaces) {
	const source = readFileSync(resolve(root, path), "utf8");
	if (!/SatisPlanner/i.test(source))
		errors.push(`${path} is missing the SatisPlanner product name.`);
	if (/\bFicsit Companion\b/i.test(source))
		errors.push(`${path} exposes the upstream name as product branding.`);
}

if (errors.length > 0) {
	for (const error of errors) console.error(error);
	process.exit(1);
}
console.log(
	`Stable RC policy verified: ${markdownFiles.length} Markdown files, 15 delivery records and 3 examples.`,
);
