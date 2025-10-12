export interface DifferentiatingSymptom {
  condition: string;
  symptomsToCheck: string[];
}

export interface AnalysisResponse {
  criticalWarning?: string;
  summary: string;
  disclaimer: string;
  possibleConditions: {
    name: string;
    reasoning: string;
    confidence: "High" | "Medium" | "Low";
  }[];
  differentiatingSymptoms: DifferentiatingSymptom[];
  nextSteps: string[];
}

export interface HistoryItem {
  id: string;
  symptoms: string;
  response: AnalysisResponse;
  timestamp: {
    _seconds: number;
    _nanoseconds: number;
  };
}
