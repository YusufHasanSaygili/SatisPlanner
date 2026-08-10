import { useCallback, useMemo, useState } from "react";
import {
	Background,
	Controls,
	MiniMap,
	ReactFlow,
	ReactFlowProvider,
	type Edge,
	type Node,
	type ReactFlowInstance,
	useNodesState,
} from "@xyflow/react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import {
	applyCommand,
	createMachineId,
	createPlan,
	type FactoryPlan,
} from "./domain";
import "@xyflow/react/dist/style.css";
import "./styles.css";

interface BenchmarkResult {
	readonly nodeCount: number;
	readonly edgeCount: number;
	readonly singleNodeUpdateMs: number;
	readonly panZoom20FramesMs: number;
}

interface DocsProbe {
	readonly canonicalPath: string;
	readonly byteLength: number;
	readonly modifiedBeforeMs: number;
	readonly modifiedAfterMs: number;
}

declare global {
	interface Window {
		satisPlannerBenchmark?: { run: () => Promise<BenchmarkResult> };
	}
}

const initialPlan = createPlan(200);

function projectNodes(plan: FactoryPlan): Node[] {
	return plan.machines.map((machine, index) => ({
		id: machine.id,
		position: { x: (index % 20) * 190, y: Math.floor(index / 20) * 105 },
		data: { label: `Constructor ${index + 1} · ${machine.clockPercent}%` },
		style: { width: 165 },
	}));
}

const initialEdges: Edge[] = Array.from({ length: 199 }, (_, index) => ({
	id: `edge-${index}`,
	source: createMachineId(index),
	target: createMachineId(index + 1),
	animated: false,
}));

const nextFrame = () =>
	new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

function SpikeCanvas() {
	const [plan, setPlan] = useState(initialPlan);
	const [nodes, setNodes, onNodesChange] = useNodesState(
		projectNodes(initialPlan),
	);
	const [probe, setProbe] = useState<DocsProbe | null>(null);
	const [probeError, setProbeError] = useState<string | null>(null);
	const edges = useMemo(() => initialEdges, []);

	const updateOneMachine = useCallback(
		(clockPercent = 200) => {
			const machineId = createMachineId(137);
			const result = applyCommand(plan, {
				type: "machine.set-clock",
				machineId,
				clockPercent,
			});
			if (!result.ok) throw new Error(result.code);
			setPlan(result.plan);
			setNodes((current) =>
				current.map((node) =>
					node.id === machineId
						? { ...node, data: { label: `Constructor 138 · ${clockPercent}%` } }
						: node,
				),
			);
		},
		[plan, setNodes],
	);

	const onInit = useCallback(
		(instance: ReactFlowInstance) => {
			window.satisPlannerBenchmark = {
				run: async () => {
					await nextFrame();
					const updateStart = performance.now();
					updateOneMachine(200);
					await nextFrame();
					await nextFrame();
					const singleNodeUpdateMs = performance.now() - updateStart;

					const panZoomStart = performance.now();
					for (let index = 0; index < 20; index += 1) {
						await instance.setViewport({
							x: -index * 8,
							y: -index * 3,
							zoom: 0.8 + index * 0.005,
						});
						await nextFrame();
					}
					const panZoom20FramesMs = performance.now() - panZoomStart;
					return {
						nodeCount: nodes.length,
						edgeCount: edges.length,
						singleNodeUpdateMs,
						panZoom20FramesMs,
					};
				},
			};
		},
		[edges.length, nodes.length, updateOneMachine],
	);

	const selectDocs = useCallback(async () => {
		try {
			setProbeError(null);
			const selected = await open({
				multiple: false,
				directory: false,
				filters: [{ name: "Satisfactory Docs", extensions: ["json"] }],
			});
			if (!selected) return;
			setProbe(await invoke<DocsProbe>("probe_docs_file", { path: selected }));
		} catch (error) {
			setProbeError(String(error));
		}
	}, []);

	return (
		<main>
			<header>
				<div>
					<strong>SatisPlanner rewrite spike</strong>
					<span data-ready="true">
						{nodes.length} physical instances · {edges.length} edges
					</span>
				</div>
				<button
					type="button"
					onClick={() =>
						updateOneMachine(
							plan.machines[137].clockPercent === 100 ? 200 : 100,
						)
					}
				>
					Toggle instance 138 clock
				</button>
				<button type="button" onClick={selectDocs}>
					Select local Docs JSON (read-only)
				</button>
			</header>
			{probe && (
				<output>
					{probe.byteLength.toLocaleString()} bytes · unchanged:{" "}
					{String(probe.modifiedBeforeMs === probe.modifiedAfterMs)}
				</output>
			)}
			{probeError && <output className="error">{probeError}</output>}
			<section aria-label="200 node React Flow benchmark canvas">
				<ReactFlow
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onInit={onInit}
					fitView
					minZoom={0.1}
				>
					<Background />
					<MiniMap pannable zoomable />
					<Controls />
				</ReactFlow>
			</section>
		</main>
	);
}

export default function App() {
	return (
		<ReactFlowProvider>
			<SpikeCanvas />
		</ReactFlowProvider>
	);
}
