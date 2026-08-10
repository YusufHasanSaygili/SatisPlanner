import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const workspaceRoot = fileURLToPath(new URL("../", import.meta.url));
const buildRoot = join(workspaceRoot, "build");
await mkdir(buildRoot, { recursive: true });
const probeRoot = await mkdtemp(join(buildRoot, "quality-probe-"));
const probeRelativePath = relative(buildRoot, probeRoot);
if (probeRelativePath.startsWith("..") || isAbsolute(probeRelativePath)) {
	throw new Error("Refusing to use a quality probe outside the build directory");
}
const pnpmCli = process.env.npm_execpath;
if (!pnpmCli) throw new Error("pnpm entry point is unavailable");

function expectFailure(name, args) {
	const result = spawnSync(process.execPath, [pnpmCli, ...args], {
		cwd: workspaceRoot,
		encoding: "utf8",
		stdio: "pipe",
	});
	if (result.error) throw result.error;
	if (result.status === 0) {
		throw new Error(`${name} probe unexpectedly passed`);
	}
	console.log(`${name} gate rejected its controlled failure.`);
}

try {
	const lintProbe = join(probeRoot, "lint-failure.ts");
	const typeProbe = join(probeRoot, "type-failure.ts");
	const testProbe = join(probeRoot, "test-failure.test.ts");

	await writeFile(lintProbe, "debugger;\n", "utf8");
	await writeFile(typeProbe, "const value: string = 42;\nvoid value;\n", "utf8");
	await writeFile(
		testProbe,
		'import { expect, test } from "vitest";\ntest("controlled failure", () => expect(true).toBe(false));\n',
		"utf8",
	);

	expectFailure("lint", ["exec", "biome", "lint", lintProbe]);
	expectFailure("typecheck", ["exec", "tsc", "--noEmit", "--strict", "--skipLibCheck", typeProbe]);
	expectFailure("unit test", ["exec", "vitest", "run", testProbe]);
} finally {
	await rm(probeRoot, { recursive: true, force: true });
}
