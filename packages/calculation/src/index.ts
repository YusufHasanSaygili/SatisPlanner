export interface CalculationFoundationStatus {
	readonly kind: "calculation-foundation";
	readonly engineEnabled: true;
	readonly resourceExtractionEnabled: true;
}

export function getCalculationFoundationStatus(): CalculationFoundationStatus {
	return {
		kind: "calculation-foundation",
		engineEnabled: true,
		resourceExtractionEnabled: true,
	};
}

export * from "./resource-extraction";
export * from "./somersloop";
