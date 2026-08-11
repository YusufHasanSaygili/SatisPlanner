export interface CalculationFoundationStatus {
	readonly kind: "calculation-foundation";
	readonly engineEnabled: true;
	readonly resourceExtractionEnabled: true;
	readonly materialFlowEnabled: true;
}

export function getCalculationFoundationStatus(): CalculationFoundationStatus {
	return {
		kind: "calculation-foundation",
		engineEnabled: true,
		resourceExtractionEnabled: true,
		materialFlowEnabled: true,
	};
}

export * from "./flow-engine";
export * from "./formula-engine";
export * from "./resource-extraction";
export * from "./somersloop";
