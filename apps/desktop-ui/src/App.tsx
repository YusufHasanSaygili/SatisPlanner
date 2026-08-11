import {
	calculateResourceExtraction,
	calculateSomersloopMultiplier,
	extractionStrategyRegistry,
	getCalculationFoundationStatus,
} from "@satisplanner/calculation";
import {
	addMachineNode,
	addResourceNode,
	connectMachinePorts,
	deletePlanEntities,
	duplicateMachineNode,
	duplicateMachineNodes,
	movePlanNode,
	parseFactoryPlan,
	Rational,
	rebindMachineRecipe,
	serializeFactoryPlan,
	setPlanViewport,
	updateMachineNodeSettings,
	updateResourceNodeSettings,
	validateConnection,
	type FactoryPlanV3,
	type MachineSettingsPatch,
	type ResourceSettingsPatch,
} from "@satisplanner/domain";
import {
	FALLBACK_GRAPH_CATALOG,
	FALLBACK_GRAPH_CATALOG_VERSION,
	FALLBACK_ICON_PATHS,
	FALLBACK_MACHINE_BUILDINGS,
	FALLBACK_RESOURCE_CATALOG,
	getGameDataFoundationStatus,
} from "@satisplanner/game-data";
import {
	projectFactoryPlan,
	type GraphCanvasNode,
	type MachineCanvasNode,
	type ResourceCanvasNode,
} from "@satisplanner/graph-adapter";
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

const PLAN_STORAGE_KEY = "satisplanner.slice-07.factory-plan";
const LEGACY_PLAN_STORAGE_KEY = "satisplanner.slice-06.factory-plan";
const DRAG_MIME = "application/x-satisplanner-node-template";

interface SelectionState {
	readonly nodeIds: readonly string[];
	readonly edgeIds: readonly string[];
}

function createEmptyPlan(): FactoryPlanV3 {
	const now = new Date().toISOString();
	return {
		schemaVersion: 3,
		planId: crypto.randomUUID(),
		name: "My factory plan",
		createdAt: now,
		updatedAt: now,
		gameDataSnapshotId: FALLBACK_GRAPH_CATALOG_VERSION,
		gameProfile: { id: "satisfactory", version: "1.2" },
		nodes: [],
		edges: [],
		viewport: { x: 0, y: 0, zoom: 1 },
		userMetadata: { graphUxSlice: 6 },
	};
}

function restorePlan(): FactoryPlanV3 {
	const saved =
		localStorage.getItem(PLAN_STORAGE_KEY) ?? localStorage.getItem(LEGACY_PLAN_STORAGE_KEY);
	if (!saved) return createEmptyPlan();
	const result = parseFactoryPlan(saved);
	return result.ok ? result.value : createEmptyPlan();
}

function formatMaterialId(materialId: string): string {
	return materialId.replace(/^Desc_|_C$/g, "");
}

function MachineNodeCard({ data, selected }: NodeProps<MachineCanvasNode>) {
	return (
		<div className={selected ? "machine-node selected" : "machine-node"}>
			<div className="machine-node-title">{data.label}</div>
			<div className="machine-node-id">{data.buildingId}</div>
			<div className="machine-node-settings">
				<span>{data.clockPercent}%</span>
				<span>{data.powerShardCount} shards</span>
				<span>{data.somersloopCount} sloops</span>
			</div>
			<section className="port-list input-ports" aria-label={`${data.label} inputs`}>
				{data.inputs.map((port, index) => (
					<div className="port-row" key={port.id}>
						<Handle
							id={port.id}
							type="target"
							position={Position.Left}
							style={{ top: 94 + index * 24 }}
							aria-label={`Input ${port.materialId}`}
						/>
						<span>{formatMaterialId(port.materialId)}</span>
						<small>{port.materialForm}</small>
					</div>
				))}
			</section>
			<section className="port-list output-ports" aria-label={`${data.label} outputs`}>
				{data.outputs.map((port, index) => (
					<div className="port-row output" key={port.id}>
						<span>{formatMaterialId(port.materialId)}</span>
						<small>{port.materialForm}</small>
						<Handle
							id={port.id}
							type="source"
							position={Position.Right}
							style={{ top: 94 + index * 24 }}
							aria-label={`Output ${port.materialId}`}
						/>
					</div>
				))}
			</section>
		</div>
	);
}

function ResourceNodeCard({ data, selected }: NodeProps<ResourceCanvasNode>) {
	return (
		<div className={selected ? "resource-node selected" : "resource-node"}>
			<p className="resource-node-kind">Resource source</p>
			<div className="machine-node-title">{data.label}</div>
			<div className="resource-node-summary">
				<span>{data.purity}</span>
				<span>{data.extractorTierId}</span>
				<span>{data.clockPercent}%</span>
			</div>
			<div className="port-row output resource-output">
				<span>{formatMaterialId(data.output.materialId)}</span>
				<small>{data.output.materialForm}</small>
				<Handle
					id={data.output.id}
					type="source"
					position={Position.Right}
					aria-label={`Output ${data.output.materialId}`}
				/>
			</div>
		</div>
	);
}

const nodeTypes = { machine: MachineNodeCard, resource: ResourceNodeCard };

function GraphWorkspace() {
	const flow = useReactFlow<GraphCanvasNode>();
	const [plan, setPlan] = useState<FactoryPlanV3>(restorePlan);
	const [selection, setSelection] = useState<SelectionState>({ nodeIds: [], edgeIds: [] });
	const [query, setQuery] = useState("");
	const [machineRecipeQuery, setMachineRecipeQuery] = useState("");
	const [machineError, setMachineError] = useState<string | null>(null);
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
	const filteredResources = useMemo(
		() =>
			FALLBACK_RESOURCE_CATALOG.filter((entry) =>
				[entry.displayName, entry.classId, entry.resourceId, ...entry.aliases]
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
	const selectedResource = selectedNode?.kind === "resource" ? selectedNode : undefined;
	const selectedMachine = selectedNode?.kind === "machine" ? selectedNode : undefined;
	const selectedMachineDefinition = selectedMachine
		? FALLBACK_MACHINE_BUILDINGS.find((entry) => entry.buildingId === selectedMachine.buildingId)
		: undefined;
	const compatibleMachineRecipes = selectedMachineDefinition
		? FALLBACK_GRAPH_CATALOG.filter(
				(entry) =>
					entry.buildingId === selectedMachineDefinition.buildingId &&
					selectedMachineDefinition.compatibleRecipeIds.includes(entry.recipeId),
			)
		: [];
	const selectedMachineResolved = selectedMachine
		? compatibleMachineRecipes.some((entry) => entry.recipeId === selectedMachine.recipeId)
		: false;
	const filteredMachineRecipes = compatibleMachineRecipes.filter((entry) =>
		[entry.displayName, entry.recipeId, ...entry.aliases]
			.join(" ")
			.toLocaleLowerCase()
			.includes(machineRecipeQuery.trim().toLocaleLowerCase()),
	);
	const selectedMachineId = selectedMachine?.id;
	useEffect(() => {
		setMachineRecipeQuery("");
		setMachineError(null);
		if (selectedMachineId) setDiagnostic(`Selected machine ${selectedMachineId}.`);
	}, [selectedMachineId]);
	const selectedExtraction = selectedResource
		? calculateResourceExtraction({
				strategyId: selectedResource.extractorStrategyId,
				tierId: selectedResource.extractorTierId,
				resourceId: selectedResource.resourceId,
				materialForm: selectedResource.ports[0]?.materialForm ?? "solid",
				purity: selectedResource.purity,
				clockPercent: selectedResource.clockPercent,
				powerShardCount: selectedResource.powerShardCount,
			})
		: undefined;
	const selectedStrategy = selectedResource
		? extractionStrategyRegistry.get(selectedResource.extractorStrategyId)
		: undefined;
	const rateDisplay =
		selectedExtraction?.ok === true
			? `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(
					Number(Rational.parse(selectedExtraction.ratePerMinute).toDecimal(4)),
				)} ${selectedExtraction.unit}`
			: undefined;

	function editSelectedResource(patch: ResourceSettingsPatch): void {
		if (!selectedResource) return;
		try {
			const next = updateResourceNodeSettings(plan, selectedResource.id, patch);
			const updated = next.nodes.find((node) => node.id === selectedResource.id);
			if (updated?.kind !== "resource") return;
			const result = calculateResourceExtraction({
				strategyId: updated.extractorStrategyId,
				tierId: updated.extractorTierId,
				resourceId: updated.resourceId,
				materialForm: updated.ports[0]?.materialForm ?? "solid",
				purity: updated.purity,
				clockPercent: updated.clockPercent,
				powerShardCount: updated.powerShardCount,
			});
			if (!result.ok) {
				setDiagnostic(result.diagnostic.message);
				return;
			}
			setPlan(next);
			setDiagnostic(`${updated.displayName} extraction settings updated.`);
		} catch (error) {
			setDiagnostic(error instanceof Error ? error.message : "Resource settings are invalid.");
		}
	}

	function editSelectedMachine(patch: MachineSettingsPatch): boolean {
		if (!selectedMachine || !selectedMachineDefinition) {
			setMachineError("This machine is unresolved in the active catalog and cannot be edited.");
			return false;
		}
		try {
			const next = updateMachineNodeSettings(
				plan,
				selectedMachine.id,
				selectedMachineDefinition,
				patch,
			);
			setPlan(next);
			setMachineError(null);
			setDiagnostic(`${selectedMachineDefinition.displayName} instance settings updated.`);
			return true;
		} catch (error) {
			setMachineError(error instanceof Error ? error.message : "Machine settings are invalid.");
			return false;
		}
	}

	function selectMachineRecipe(recipe: (typeof FALLBACK_GRAPH_CATALOG)[number]): void {
		if (!selectedMachine || !selectedMachineDefinition) return;
		try {
			const missingPortCount = recipe.ports.filter(
				(port) => !selectedMachine.ports.some((current) => current.key === port.key),
			).length;
			const result = rebindMachineRecipe(
				plan,
				selectedMachine.id,
				selectedMachineDefinition,
				recipe,
				Array.from({ length: missingPortCount }, () => crypto.randomUUID()),
			);
			if (!result.applied) {
				setMachineError(result.diagnostics.map((entry) => entry.message).join(" "));
				return;
			}
			setPlan(result.plan);
			const reviewMessage = result.diagnostics.map((entry) => entry.message).join(" ");
			setMachineError(reviewMessage || null);
			setDiagnostic(
				reviewMessage || `${selectedMachineDefinition.displayName} recipe changed safely.`,
			);
		} catch (error) {
			setMachineError(error instanceof Error ? error.message : "Recipe change is invalid.");
		}
	}

	return (
		<div className="workspace">
			<aside className="panel library-panel" aria-label="Building library">
				<div className="panel-heading">
					<span>Library</span>
					<kbd>⌘ K</kbd>
				</div>
				<input
					aria-label="Search catalog"
					placeholder="Search resources, buildings or class id"
					value={query}
					onChange={(event) => setQuery(event.currentTarget.value)}
				/>
				<div className="catalog-meta">
					<span>Resources</span>
					<small>{filteredResources.length} entries</small>
				</div>
				<section className="catalog-list" aria-label="Resource catalog">
					{filteredResources.map((entry) => (
						<button
							className="catalog-entry resource-entry"
							type="button"
							draggable
							key={entry.classId}
							aria-label={`Drag resource ${entry.displayName}`}
							onDragStart={(event) => {
								event.dataTransfer.setData(DRAG_MIME, entry.classId);
								event.dataTransfer.effectAllowed = "copy";
							}}
						>
							<img
								src={`/${
									entry.materialForm === "fluid"
										? FALLBACK_ICON_PATHS["material-fluid"]
										: FALLBACK_ICON_PATHS["material-solid"]
								}`}
								alt=""
							/>
							<span>
								<strong>{entry.displayName}</strong>
								<small>{entry.classId}</small>
							</span>
						</button>
					))}
				</section>
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
					const machineTemplate = FALLBACK_GRAPH_CATALOG.find((entry) => entry.classId === classId);
					const resourceTemplate = FALLBACK_RESOURCE_CATALOG.find(
						(entry) => entry.classId === classId,
					);
					if (!machineTemplate && !resourceTemplate) {
						setDiagnostic("The dropped library payload is not recognized.");
						return;
					}
					const position = flow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
					if (resourceTemplate) {
						setPlan((current) =>
							addResourceNode(current, resourceTemplate, position, {
								nodeId: crypto.randomUUID(),
								portIds: [crypto.randomUUID()],
							}),
						);
						setDiagnostic(`${resourceTemplate.displayName} added as a resource instance.`);
						return;
					}
					if (machineTemplate) {
						setPlan((current) =>
							addMachineNode(current, machineTemplate, position, {
								nodeId: crypto.randomUUID(),
								portIds: machineTemplate.ports.map(() => crypto.randomUUID()),
							}),
						);
						setDiagnostic(`${machineTemplate.displayName} added as a new machine instance.`);
					}
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
						setPlan((current) => movePlanNode(current, node.id, node.position))
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
				{selectedMachine && (
					<section className="inspector-card" aria-label="Machine inspector">
						<p className="eyebrow">Machine instance</p>
						<h2>{selectedMachine.displayName}</h2>
						<dl>
							<div>
								<dt>UUID</dt>
								<dd>{selectedMachine.id}</dd>
							</div>
							<div>
								<dt>Building</dt>
								<dd>{selectedMachine.buildingId}</dd>
							</div>
							<div>
								<dt>Recipe</dt>
								<dd>{selectedMachine.recipeId}</dd>
							</div>
							<div>
								<dt>Position</dt>
								<dd>
									{Math.round(selectedMachine.position.x)}, {Math.round(selectedMachine.position.y)}
								</dd>
							</div>
						</dl>
						{(!selectedMachineDefinition || !selectedMachineResolved) && (
							<p className="inline-error" role="alert">
								Unresolved catalog binding. The saved machine and recipe remain intact until a
								compatible catalog entry is selected.
							</p>
						)}
						{selectedMachineDefinition && (
							<>
								<label className="setting-field">
									<span>Search compatible recipes</span>
									<input
										aria-label="Search compatible recipes"
										value={machineRecipeQuery}
										onChange={(event) => setMachineRecipeQuery(event.currentTarget.value)}
									/>
								</label>
								<section className="recipe-options" aria-label="Compatible recipes">
									{filteredMachineRecipes.map((recipe) => (
										<button
											type="button"
											key={recipe.recipeId}
											aria-pressed={selectedMachine.recipeId === recipe.recipeId}
											onClick={() => selectMachineRecipe(recipe)}
										>
											{recipe.displayName}
											<small>{recipe.recipeId}</small>
										</button>
									))}
									{filteredMachineRecipes.length === 0 && (
										<small>No compatible recipe match.</small>
									)}
								</section>
								<fieldset className="quick-setting">
									<legend>Power Shards</legend>
									<div className="segmented-control shards">
										{Array.from(
											{ length: selectedMachineDefinition.powerShardSlots + 1 },
											(_, count) => count,
										).map((count) => (
											<button
												type="button"
												key={count}
												aria-label={`Set machine to ${count} Power Shards`}
												aria-pressed={selectedMachine.powerShardCount === count}
												onClick={() => {
													const maximumClock = 100 + count * 50;
													editSelectedMachine({
														powerShardCount: count,
														clockPercent: String(
															Math.min(Number(selectedMachine.clockPercent), maximumClock),
														),
													});
												}}
											>
												{count}
											</button>
										))}
									</div>
								</fieldset>
								<label className="setting-field">
									<span>Machine clock percent</span>
									<input
										key={`${selectedMachine.id}:${selectedMachine.clockPercent}`}
										aria-label="Machine clock percent"
										type="number"
										min="1"
										max="250"
										step="0.0001"
										defaultValue={selectedMachine.clockPercent}
										onBlur={(event) => {
											if (!editSelectedMachine({ clockPercent: event.currentTarget.value })) {
												event.currentTarget.value = selectedMachine.clockPercent;
											}
										}}
									/>
								</label>
								<fieldset className="quick-setting">
									<legend>Somersloops</legend>
									{selectedMachineDefinition.somersloopSlots === 0 ? (
										<>
											<button type="button" disabled aria-label="Somersloops unavailable">
												0 · 1×
											</button>
											<small>This building has no Somersloop slots.</small>
										</>
									) : (
										<div className="segmented-control sloop-options">
											{Array.from(
												{ length: selectedMachineDefinition.somersloopSlots + 1 },
												(_, count) => count,
											).map((count) => {
												const multiplier = Rational.parse(
													calculateSomersloopMultiplier(
														count,
														selectedMachineDefinition.somersloopSlots,
													),
												).toDecimal(2);
												return (
													<button
														type="button"
														key={count}
														aria-label={`Set ${count} Somersloops, ${multiplier} times multiplier`}
														aria-pressed={selectedMachine.somersloopCount === count}
														onClick={() => editSelectedMachine({ somersloopCount: count })}
													>
														{count} · {multiplier}×
													</button>
												);
											})}
										</div>
									)}
								</fieldset>
								<label className="standby-control">
									<input
										type="checkbox"
										checked={selectedMachine.standby}
										onChange={(event) =>
											editSelectedMachine({ standby: event.currentTarget.checked })
										}
									/>
									Standby
								</label>
							</>
						)}
						{machineError && (
							<div className="inline-error" role="alert">
								{machineError}
								{machineError.startsWith("Clock") && selectedMachineDefinition && (
									<button
										type="button"
										onClick={() =>
											editSelectedMachine({
												clockPercent: String(100 + selectedMachine.powerShardCount * 50),
											})
										}
									>
										Use shard-safe clock
									</button>
								)}
							</div>
						)}
						<div className="instance-actions">
							<button
								type="button"
								onClick={() => {
									setPlan((current) =>
										duplicateMachineNode(current, selectedMachine.id, {
											nodeId: crypto.randomUUID(),
											portIds: selectedMachine.ports.map(() => crypto.randomUUID()),
										}),
									);
									setDiagnostic(
										`${selectedMachine.displayName} duplicated as an independent instance.`,
									);
								}}
							>
								Duplicate instance
							</button>
							<button
								type="button"
								onClick={() => {
									setPlan((current) =>
										duplicateMachineNodes(
											current,
											selectedMachine.id,
											["#2", "#3"].map((labelSuffix) => ({
												nodeId: crypto.randomUUID(),
												portIds: selectedMachine.ports.map(() => crypto.randomUUID()),
												labelSuffix,
											})),
										),
									);
									setDiagnostic(
										`${selectedMachine.displayName} duplicated into two isolated instances.`,
									);
								}}
							>
								Duplicate twice
							</button>
						</div>
					</section>
				)}
				{selectedResource && (
					<section className="inspector-card resource-inspector" aria-label="Resource inspector">
						<p className="eyebrow">Resource source instance</p>
						<h2>{selectedResource.displayName}</h2>
						<dl>
							<div>
								<dt>UUID</dt>
								<dd>{selectedResource.id}</dd>
							</div>
							<div>
								<dt>Resource</dt>
								<dd>{selectedResource.resourceId}</dd>
							</div>
						</dl>
						<fieldset className="quick-setting">
							<legend>Purity</legend>
							<div className="segmented-control">
								{(["impure", "normal", "pure"] as const).map((purity) => (
									<button
										type="button"
										key={purity}
										aria-label={`Set purity ${purity}`}
										aria-pressed={selectedResource.purity === purity}
										onClick={() => editSelectedResource({ purity })}
									>
										{purity[0]?.toUpperCase()}
										{purity.slice(1)}
									</button>
								))}
							</div>
						</fieldset>
						<label className="setting-field">
							<span>Extractor tier</span>
							<select
								aria-label="Extractor tier"
								value={selectedResource.extractorTierId}
								onChange={(event) =>
									editSelectedResource({ extractorTierId: event.currentTarget.value })
								}
							>
								{selectedStrategy?.descriptor.tiers.map((tier) => (
									<option key={tier.id} value={tier.id}>
										{tier.displayName}
									</option>
								))}
							</select>
						</label>
						<fieldset className="quick-setting">
							<legend>Power Shards</legend>
							<div className="segmented-control shards">
								{[0, 1, 2, 3].map((count) => (
									<button
										type="button"
										key={count}
										aria-label={`Set ${count} Power Shards`}
										aria-pressed={selectedResource.powerShardCount === count}
										onClick={() => editSelectedResource({ powerShardCount: count })}
									>
										{count}
									</button>
								))}
							</div>
						</fieldset>
						<label className="setting-field">
							<span>Clock percent</span>
							<input
								key={`${selectedResource.id}:${selectedResource.clockPercent}`}
								aria-label="Clock percent"
								type="number"
								min="1"
								max="250"
								step="0.0001"
								defaultValue={selectedResource.clockPercent}
								onBlur={(event) =>
									editSelectedResource({ clockPercent: event.currentTarget.value })
								}
							/>
						</label>
						{selectedExtraction?.ok === false && (
							<p className="inline-error" role="alert">
								{selectedExtraction.diagnostic.message}
							</p>
						)}
						{selectedExtraction?.ok === true && rateDisplay && (
							<section className="extraction-results" aria-label="Extraction results">
								<div>
									<span>Theoretical output</span>
									<strong>{rateDisplay}</strong>
								</div>
								<div>
									<span>Transportable output</span>
									<strong>{rateDisplay}</strong>
									<small>No configured edge cap</small>
								</div>
								<div>
									<span>Power</span>
									<strong>{selectedExtraction.powerMW.toFixed(2)} MW</strong>
								</div>
							</section>
						)}
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
