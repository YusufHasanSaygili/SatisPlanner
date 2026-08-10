import { getCalculationFoundationStatus } from "@satisplanner/calculation";
import {
	addMachineNode,
	connectMachinePorts,
	deletePlanEntities,
	duplicateMachineNode,
	moveMachineNode,
	parseFactoryPlan,
	serializeFactoryPlan,
	setPlanViewport,
	validateConnection,
	type FactoryPlanV2,
} from "@satisplanner/domain";
import {
	FALLBACK_GRAPH_CATALOG,
	FALLBACK_GRAPH_CATALOG_VERSION,
	FALLBACK_ICON_PATHS,
	getGameDataFoundationStatus,
} from "@satisplanner/game-data";
import { projectFactoryPlan, type MachineCanvasNode } from "@satisplanner/graph-adapter";
import {
	Background,
	Controls,
	Handle,
	MiniMap,
	Position,
	ReactFlow,
	ReactFlowProvider,
	useReactFlow,
	type Connection,
	type Edge,
	type NodeProps,
	type Viewport,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { RuntimeInfoResult } from "./native/contracts";
import { requestRuntimeInfo } from "./native/contracts";
import { createMockNativeAdapter } from "./native/mock-adapter";
import { createTauriNativeAdapter, isTauriRuntime } from "./native/tauri-adapter";

const PLAN_STORAGE_KEY = "satisplanner.slice-05.factory-plan";
const DRAG_MIME = "application/x-satisplanner-machine-template";

interface SelectionState {
	readonly nodeIds: readonly string[];
	readonly edgeIds: readonly string[];
}

function createEmptyPlan(): FactoryPlanV2 {
	const now = new Date().toISOString();
	return {
		schemaVersion: 2,
		planId: crypto.randomUUID(),
		name: "My factory plan",
		createdAt: now,
		updatedAt: now,
		gameDataSnapshotId: FALLBACK_GRAPH_CATALOG_VERSION,
		gameProfile: { id: "satisfactory", version: "1.2" },
		nodes: [],
		edges: [],
		viewport: { x: 0, y: 0, zoom: 1 },
		userMetadata: { graphUxSlice: 5 },
	};
}

function restorePlan(): FactoryPlanV2 {
	const saved = localStorage.getItem(PLAN_STORAGE_KEY);
	if (!saved) return createEmptyPlan();
	const result = parseFactoryPlan(saved);
	return result.ok ? result.value : createEmptyPlan();
}

function MachineNodeCard({ data, selected }: NodeProps<MachineCanvasNode>) {
	return (
		<div className={selected ? "machine-node selected" : "machine-node"}>
			<div className="machine-node-title">{data.label}</div>
			<div className="machine-node-id">{data.buildingId}</div>
			<section className="port-list input-ports" aria-label={`${data.label} inputs`}>
				{data.inputs.map((port, index) => (
					<div className="port-row" key={port.id}>
						<Handle
							id={port.id}
							type="target"
							position={Position.Left}
							style={{ top: 66 + index * 24 }}
							aria-label={`Input ${port.materialId}`}
						/>
						<span>{port.materialId.replace(/^Desc_|_C$/g, "")}</span>
						<small>{port.materialForm}</small>
					</div>
				))}
			</section>
			<section className="port-list output-ports" aria-label={`${data.label} outputs`}>
				{data.outputs.map((port, index) => (
					<div className="port-row output" key={port.id}>
						<span>{port.materialId.replace(/^Desc_|_C$/g, "")}</span>
						<small>{port.materialForm}</small>
						<Handle
							id={port.id}
							type="source"
							position={Position.Right}
							style={{ top: 66 + index * 24 }}
							aria-label={`Output ${port.materialId}`}
						/>
					</div>
				))}
			</section>
		</div>
	);
}

const nodeTypes = { machine: MachineNodeCard };

function GraphWorkspace() {
	const flow = useReactFlow<MachineCanvasNode>();
	const [plan, setPlan] = useState<FactoryPlanV2>(restorePlan);
	const [selection, setSelection] = useState<SelectionState>({ nodeIds: [], edgeIds: [] });
	const [query, setQuery] = useState("");
	const [diagnostic, setDiagnostic] = useState(
		"Drag a library entry onto the canvas to create a domain instance.",
	);
	const [saveStatus, setSaveStatus] = useState("Plan loaded");

	const projection = useMemo(
		() => projectFactoryPlan(plan, new Set(selection.nodeIds), new Set(selection.edgeIds)),
		[plan, selection],
	);
	const flowNodes = useMemo(() => [...projection.nodes], [projection.nodes]);
	const flowEdges = useMemo(() => [...projection.edges], [projection.edges]);
	const normalizedQuery = query.trim().toLocaleLowerCase();
	const filteredCatalog = useMemo(
		() =>
			FALLBACK_GRAPH_CATALOG.filter((entry) =>
				[entry.displayName, entry.classId, entry.buildingId, entry.recipeId, ...entry.aliases]
					.join(" ")
					.toLocaleLowerCase()
					.includes(normalizedQuery),
			),
		[normalizedQuery],
	);

	useEffect(() => {
		localStorage.setItem(PLAN_STORAGE_KEY, serializeFactoryPlan(plan));
		setSaveStatus(`Saved · ${plan.nodes.length} nodes · ${plan.edges.length} connections`);
	}, [plan]);

	useEffect(() => {
		const validNodes = selection.nodeIds.filter((id) => plan.nodes.some((node) => node.id === id));
		const validEdges = selection.edgeIds.filter((id) => plan.edges.some((edge) => edge.id === id));
		if (
			validNodes.length !== selection.nodeIds.length ||
			validEdges.length !== selection.edgeIds.length
		) {
			setSelection({ nodeIds: validNodes, edgeIds: validEdges });
		}
	}, [plan, selection]);

	const connectionParts = useCallback((connection: Connection | Edge) => {
		if (
			!connection.source ||
			!connection.target ||
			!connection.sourceHandle ||
			!connection.targetHandle
		) {
			return undefined;
		}
		return {
			sourceNodeId: connection.source,
			sourcePortId: connection.sourceHandle,
			targetNodeId: connection.target,
			targetPortId: connection.targetHandle,
		};
	}, []);

	const validatePreview = useCallback(
		(connection: Connection | Edge) => {
			const parts = connectionParts(connection);
			if (!parts) return false;
			const result = validateConnection(plan, parts);
			setDiagnostic(
				result.ok
					? `${result.materialId} is compatible via ${result.medium}.`
					: result.diagnostic.message,
			);
			return result.ok;
		},
		[connectionParts, plan],
	);

	const connect = useCallback(
		(connection: Connection) => {
			const parts = connectionParts(connection);
			if (!parts) return;
			const result = connectMachinePorts(plan, { ...parts, edgeId: crypto.randomUUID() });
			setDiagnostic(
				result.validation.ok
					? `Connected ${result.validation.materialId} via ${result.validation.medium}.`
					: result.validation.diagnostic.message,
			);
			if (result.validation.ok) setPlan(result.plan);
		},
		[connectionParts, plan],
	);

	const removeSelection = useCallback(() => {
		if (selection.nodeIds.length + selection.edgeIds.length === 0) return;
		setPlan((current) => deletePlanEntities(current, selection.nodeIds, selection.edgeIds));
		setSelection({ nodeIds: [], edgeIds: [] });
		setDiagnostic("Selection deleted. Stale inspector references were cleared.");
	}, [selection]);

	const selectedNode =
		selection.nodeIds.length === 1 && selection.edgeIds.length === 0
			? plan.nodes.find((node) => node.id === selection.nodeIds[0])
			: undefined;
	const selectedEdge =
		selection.edgeIds.length === 1 && selection.nodeIds.length === 0
			? plan.edges.find((edge) => edge.id === selection.edgeIds[0])
			: undefined;
	const selectionCount = selection.nodeIds.length + selection.edgeIds.length;

	return (
		<div className="workspace">
			<aside className="panel library-panel" aria-label="Building library">
				<div className="panel-heading">
					<span>Library</span>
					<kbd>⌘ K</kbd>
				</div>
				<input
					aria-label="Search buildings"
					placeholder="Search name, recipe or class id"
					value={query}
					onChange={(event) => setQuery(event.currentTarget.value)}
				/>
				<div className="catalog-meta">
					<span>Production</span>
					<small>{filteredCatalog.length} entries</small>
				</div>
				<section className="catalog-list" aria-label="Production catalog">
					{filteredCatalog.map((entry) => (
						<button
							className="catalog-entry"
							type="button"
							draggable
							key={entry.classId}
							aria-label={`Drag ${entry.displayName}`}
							onDragStart={(event) => {
								event.dataTransfer.setData(DRAG_MIME, entry.classId);
								event.dataTransfer.effectAllowed = "copy";
							}}
						>
							<img src={`/${FALLBACK_ICON_PATHS.building}`} alt="" />
							<span>
								<strong>{entry.displayName}</strong>
								<small>{entry.classId}</small>
							</span>
						</button>
					))}
					{filteredCatalog.length === 0 && (
						<div className="empty-state">
							<strong>No catalog match</strong>
						</div>
					)}
				</section>
				<p className="catalog-policy">
					Versioned fallback catalog · local snapshots replace it after import.
				</p>
			</aside>

			<main
				className="canvas-panel"
				aria-label="Factory canvas"
				onDragOver={(event) => {
					event.preventDefault();
					event.dataTransfer.dropEffect = "copy";
				}}
				onDrop={(event) => {
					event.preventDefault();
					const classId = event.dataTransfer.getData(DRAG_MIME);
					const template = FALLBACK_GRAPH_CATALOG.find((entry) => entry.classId === classId);
					if (!template) {
						setDiagnostic("The dropped library payload is not recognized.");
						return;
					}
					const position = flow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
					setPlan((current) =>
						addMachineNode(current, template, position, {
							nodeId: crypto.randomUUID(),
							portIds: template.ports.map(() => crypto.randomUUID()),
						}),
					);
					setDiagnostic(`${template.displayName} added as a new machine instance.`);
				}}
			>
				<ReactFlow
					nodes={flowNodes}
					edges={flowEdges}
					nodeTypes={nodeTypes}
					defaultViewport={plan.viewport}
					onConnect={connect}
					isValidConnection={validatePreview}
					onNodeDragStop={(_event, node) =>
						setPlan((current) => moveMachineNode(current, node.id, node.position))
					}
					onNodeClick={(event, node) =>
						setSelection((current) => {
							if (!event.ctrlKey && !event.metaKey) return { nodeIds: [node.id], edgeIds: [] };
							return current.nodeIds.includes(node.id)
								? { ...current, nodeIds: current.nodeIds.filter((id) => id !== node.id) }
								: { ...current, nodeIds: [...current.nodeIds, node.id] };
						})
					}
					onEdgeClick={(event, edge) =>
						setSelection((current) => {
							if (!event.ctrlKey && !event.metaKey) return { nodeIds: [], edgeIds: [edge.id] };
							return current.edgeIds.includes(edge.id)
								? { ...current, edgeIds: current.edgeIds.filter((id) => id !== edge.id) }
								: { ...current, edgeIds: [...current.edgeIds, edge.id] };
						})
					}
					onMoveEnd={(_event, viewport: Viewport) =>
						setPlan((current) => setPlanViewport(current, viewport))
					}
					elementsSelectable={false}
					deleteKeyCode={null}
				>
					<Background color="#273442" gap={24} />
					<Controls showInteractive={false} />
					<MiniMap pannable zoomable ariaLabel="Factory minimap" />
				</ReactFlow>
				<div className="canvas-diagnostics" role="status" aria-live="polite">
					<span>{diagnostic}</span>
					<small data-testid="plan-persistence">{saveStatus}</small>
				</div>
			</main>

			<aside className="panel inspector-panel" aria-label="Inspector">
				<div className="panel-heading">Inspector</div>
				{selectionCount === 0 && (
					<div className="empty-state">
						<strong>Nothing selected</strong>
						<p>Select a machine or connection to inspect its domain instance.</p>
					</div>
				)}
				{selectionCount > 1 && (
					<section className="inspector-card">
						<p className="eyebrow">Multiple selection</p>
						<h2>{selectionCount} graph entities</h2>
						<p>Bulk editing arrives in a later UX slice. Delete is available now.</p>
					</section>
				)}
				{selectedNode && (
					<section className="inspector-card" aria-label="Machine inspector">
						<p className="eyebrow">Machine instance</p>
						<h2>{selectedNode.displayName}</h2>
						<dl>
							<div>
								<dt>UUID</dt>
								<dd>{selectedNode.id}</dd>
							</div>
							<div>
								<dt>Building</dt>
								<dd>{selectedNode.buildingId}</dd>
							</div>
							<div>
								<dt>Recipe</dt>
								<dd>{selectedNode.recipeId}</dd>
							</div>
							<div>
								<dt>Position</dt>
								<dd>
									{Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)}
								</dd>
							</div>
						</dl>
						<button
							type="button"
							onClick={() => {
								setPlan((current) =>
									duplicateMachineNode(current, selectedNode.id, {
										nodeId: crypto.randomUUID(),
										portIds: selectedNode.ports.map(() => crypto.randomUUID()),
									}),
								);
								setDiagnostic(`${selectedNode.displayName} duplicated as an independent instance.`);
							}}
						>
							Duplicate instance
						</button>
					</section>
				)}
				{selectedEdge && (
					<section className="inspector-card" aria-label="Connection inspector">
						<p className="eyebrow">Connection instance</p>
						<h2>{selectedEdge.itemOrFluidId}</h2>
						<dl>
							<div>
								<dt>UUID</dt>
								<dd>{selectedEdge.id}</dd>
							</div>
							<div>
								<dt>Medium</dt>
								<dd>{selectedEdge.medium}</dd>
							</div>
						</dl>
					</section>
				)}
				{selectionCount > 0 && (
					<button className="danger-button" type="button" onClick={removeSelection}>
						Delete selection
					</button>
				)}
			</aside>
		</div>
	);
}

export default function App() {
	const nativeAdapter = useMemo(
		() => (isTauriRuntime() ? createTauriNativeAdapter() : createMockNativeAdapter()),
		[],
	);
	const [runtimeInfo, setRuntimeInfo] = useState<RuntimeInfoResult | null>(null);

	useEffect(() => {
		void requestRuntimeInfo(nativeAdapter, crypto.randomUUID()).then(setRuntimeInfo);
	}, [nativeAdapter]);

	const domain = getCalculationFoundationStatus();
	const gameData = getGameDataFoundationStatus();

	return (
		<div className="app-shell">
			<header className="title-bar">
				<div>
					<p className="eyebrow">Domain-backed graph workspace</p>
					<h1>SatisPlanner</h1>
				</div>
				<div className="runtime-status" role="status">
					<span className={runtimeInfo?.ok ? "status-dot ready" : "status-dot"} />
					{runtimeInfo === null && "Connecting to desktop contract…"}
					{runtimeInfo?.ok &&
						`Contract v1 · ${runtimeInfo.data.runtime} · v${runtimeInfo.data.applicationVersion}`}
					{runtimeInfo && !runtimeInfo.ok && runtimeInfo.error.message}
					<span className="foundation-signal" title="Package boundaries ready">
						{domain.kind === "calculation-foundation" && !gameData.catalogLoaded
							? "offline"
							: "ready"}
					</span>
				</div>
			</header>
			<ReactFlowProvider>
				<GraphWorkspace />
			</ReactFlowProvider>
		</div>
	);
}
