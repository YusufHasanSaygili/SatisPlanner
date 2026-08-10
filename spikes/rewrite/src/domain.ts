export type MachineId = string & { readonly __brand: "MachineId" };

export interface MachineInstance {
	readonly id: MachineId;
	readonly buildingId: string;
	readonly recipeId: string;
	readonly clockPercent: number;
}

export interface FactoryPlan {
	readonly schemaVersion: 1;
	readonly machines: readonly MachineInstance[];
}

export interface SetMachineClockCommand {
	readonly type: "machine.set-clock";
	readonly machineId: MachineId;
	readonly clockPercent: number;
}

export type DomainCommand = SetMachineClockCommand;

export type CommandResult =
	| { readonly ok: true; readonly plan: FactoryPlan }
	| {
			readonly ok: false;
			readonly code: "MACHINE_NOT_FOUND" | "CLOCK_OUT_OF_RANGE";
	  };

export function applyCommand(
	plan: FactoryPlan,
	command: DomainCommand,
): CommandResult {
	if (command.clockPercent < 1 || command.clockPercent > 250) {
		return { ok: false, code: "CLOCK_OUT_OF_RANGE" };
	}

	const machineIndex = plan.machines.findIndex(
		({ id }) => id === command.machineId,
	);
	if (machineIndex < 0) {
		return { ok: false, code: "MACHINE_NOT_FOUND" };
	}

	const machines = [...plan.machines];
	machines[machineIndex] = {
		...machines[machineIndex],
		clockPercent: command.clockPercent,
	};

	return {
		ok: true,
		plan: { ...plan, machines },
	};
}

export function createMachineId(index: number): MachineId {
	return `machine-${index.toString().padStart(3, "0")}` as MachineId;
}

export function createPlan(size = 200): FactoryPlan {
	return {
		schemaVersion: 1,
		machines: Array.from({ length: size }, (_, index) => ({
			id: createMachineId(index),
			buildingId: "Build_ConstructorMk1_C",
			recipeId: "Recipe_IronPlate_C",
			clockPercent: 100,
		})),
	};
}
