import { chromium } from "playwright-core";
import { spawn } from "node:child_process";

const preview = spawn(
	process.execPath,
	["./node_modules/vite/bin/vite.js", "preview"],
	{
		cwd: new URL("..", import.meta.url),
		stdio: ["ignore", "pipe", "pipe"],
	},
);

const waitForServer = async () => {
	for (let attempt = 0; attempt < 40; attempt += 1) {
		try {
			const response = await fetch("http://127.0.0.1:4173");
			if (response.ok) return;
		} catch {}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error("Vite preview did not start");
};

try {
	await waitForServer();
	const browser = await chromium.launch({ channel: "msedge", headless: true });
	const page = await browser.newPage({
		viewport: { width: 1440, height: 900 },
	});
	await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
	await page.locator('[data-ready="true"]').waitFor();
	const result = await page.evaluate(async () => {
		if (!window.satisPlannerBenchmark)
			throw new Error("Benchmark API unavailable");
		return window.satisPlannerBenchmark.run();
	});
	console.log(
		JSON.stringify(
			{ ...result, browser: "Microsoft Edge (headless)" },
			null,
			2,
		),
	);
	await browser.close();
} finally {
	preview.kill();
}
