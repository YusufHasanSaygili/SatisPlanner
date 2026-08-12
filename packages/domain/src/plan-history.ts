import type { FactoryPlanV3 } from "./plan-schema";

export const PLAN_HISTORY_POLICY =
	"Session-only: saving does not clear history; reloading or importing starts a new history." as const;

export interface PlanHistoryState {
	readonly canUndo: boolean;
	readonly canRedo: boolean;
	readonly undoLabel: string | null;
	readonly redoLabel: string | null;
}

interface HistoryEntry {
	readonly label: string;
	readonly plan: FactoryPlanV3;
}

export class PlanCommandHistory {
	#current: FactoryPlanV3;
	readonly #past: HistoryEntry[] = [];
	readonly #future: HistoryEntry[] = [];
	readonly #limit: number;

	constructor(initialPlan: FactoryPlanV3, limit = 100) {
		this.#current = initialPlan;
		this.#limit = limit;
	}

	get current(): FactoryPlanV3 {
		return this.#current;
	}

	get state(): PlanHistoryState {
		return {
			canUndo: this.#past.length > 0,
			canRedo: this.#future.length > 0,
			undoLabel: this.#past.at(-1)?.label ?? null,
			redoLabel: this.#future.at(-1)?.label ?? null,
		};
	}

	execute(label: string, update: (plan: FactoryPlanV3) => FactoryPlanV3): FactoryPlanV3 {
		const next = update(this.#current);
		if (next === this.#current) return this.#current;
		this.#past.push({ label, plan: this.#current });
		if (this.#past.length > this.#limit) this.#past.shift();
		this.#future.length = 0;
		this.#current = next;
		return next;
	}

	transaction(
		label: string,
		updates: readonly ((plan: FactoryPlanV3) => FactoryPlanV3)[],
	): FactoryPlanV3 {
		return this.execute(label, (plan) =>
			updates.reduce((current, update) => update(current), plan),
		);
	}

	undo(): FactoryPlanV3 {
		const previous = this.#past.pop();
		if (!previous) return this.#current;
		this.#future.push({ label: previous.label, plan: this.#current });
		this.#current = previous.plan;
		return this.#current;
	}

	redo(): FactoryPlanV3 {
		const next = this.#future.pop();
		if (!next) return this.#current;
		this.#past.push({ label: next.label, plan: this.#current });
		this.#current = next.plan;
		return this.#current;
	}

	reset(plan: FactoryPlanV3): FactoryPlanV3 {
		this.#past.length = 0;
		this.#future.length = 0;
		this.#current = plan;
		return plan;
	}
}
