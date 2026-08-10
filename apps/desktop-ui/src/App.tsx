import { getCalculationFoundationStatus } from "@satisplanner/calculation";
import { getDomainFoundationStatus } from "@satisplanner/domain";
import { FALLBACK_ICON_PATHS, getGameDataFoundationStatus } from "@satisplanner/game-data";
import { createFoundationCanvasNodes } from "@satisplanner/graph-adapter";
import { Background, Controls, ReactFlow } from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import type { RuntimeInfoResult } from "./native/contracts";
import { requestRuntimeInfo } from "./native/contracts";
import { createMockNativeAdapter } from "./native/mock-adapter";
import { createTauriNativeAdapter, isTauriRuntime } from "./native/tauri-adapter";

export default function App() {
	const nodes = useMemo(() => createFoundationCanvasNodes(), []);
	const nativeAdapter = useMemo(
		() => (isTauriRuntime() ? createTauriNativeAdapter() : createMockNativeAdapter()),
		[],
	);
	const [runtimeInfo, setRuntimeInfo] = useState<RuntimeInfoResult | null>(null);

	useEffect(() => {
		void requestRuntimeInfo(nativeAdapter, crypto.randomUUID()).then(setRuntimeInfo);
	}, [nativeAdapter]);

	const domain = getDomainFoundationStatus();
	const gameData = getGameDataFoundationStatus();
	const calculation = getCalculationFoundationStatus();
	const fallbackIcons = Object.entries(FALLBACK_ICON_PATHS);

	return (
		<div className="app-shell">
			<header className="title-bar">
				<div>
					<p className="eyebrow">Factory planning workspace</p>
					<h1>SatisPlanner</h1>
				</div>
				<div className="runtime-status" role="status">
					<span className={runtimeInfo?.ok ? "status-dot ready" : "status-dot"} />
					{runtimeInfo === null && "Connecting to desktop contract…"}
					{runtimeInfo?.ok &&
						`Contract v1 · ${runtimeInfo.data.runtime} · v${runtimeInfo.data.applicationVersion}`}
					{runtimeInfo && !runtimeInfo.ok && runtimeInfo.error.message}
				</div>
			</header>

			<div className="workspace">
				<aside className="panel library-panel" aria-label="Building library">
					<div className="panel-heading">
						<span>Library</span>
						<kbd>⌘ K</kbd>
					</div>
					<input
						aria-label="Search buildings"
						placeholder="Search buildings and recipes"
						disabled
					/>
					<div className="empty-state">
						<strong>Catalog not imported</strong>
						<p>Local catalogs and icon caches remain user-controlled and optional.</p>
					</div>
					<section className="fallback-preview" aria-label="Generic icon fallbacks">
						{fallbackIcons.map(([category, relativePath]) => (
							<img key={category} src={`/${relativePath}`} alt={`Generic ${category} fallback`} />
						))}
					</section>
				</aside>

				<main className="canvas-panel" aria-label="Factory canvas">
					<ReactFlow nodes={nodes} edges={[]} fitView nodesDraggable={false}>
						<Background color="#273442" gap={24} />
						<Controls showInteractive={false} />
					</ReactFlow>
				</main>

				<aside className="panel inspector-panel" aria-label="Inspector">
					<div className="panel-heading">Inspector</div>
					<div className="empty-state">
						<strong>Nothing selected</strong>
						<p>Select a machine or connection to edit its instance settings.</p>
					</div>
					<dl className="foundation-checks">
						<div>
							<dt>Domain</dt>
							<dd>{domain.frameworkIndependent ? "isolated" : "unavailable"}</dd>
						</div>
						<div>
							<dt>Game data</dt>
							<dd>{gameData.catalogLoaded ? "loaded" : "waiting"}</dd>
						</div>
						<div>
							<dt>Calculation</dt>
							<dd>{calculation.engineEnabled ? "enabled" : "waiting"}</dd>
						</div>
					</dl>
				</aside>
			</div>
		</div>
	);
}
