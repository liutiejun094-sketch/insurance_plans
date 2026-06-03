export type InputType = 'text' | 'file' | 'image';

export type TaskStatus = 'pending' | 'processing' | 'ocr' | 'parsing' | 'comparing' | 'completed' | 'failed';

export type ImpactType = 'advantage' | 'disadvantage' | 'neutral' | 'same';

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface CriticalIllness {
  types?: number;
  payoutRatio?: string;
  payoutCount?: number;
  coverage?: string;
}

export interface MildIllness {
  payoutRatio?: string;
  payoutCount?: number;
}

export interface MiddleIllness {
  payoutRatio?: string;
  payoutCount?: number;
}

export interface GeneralMedical {
  coverage?: string;
  deductible?: string;
  reimbursementRatio?: string;
}

export interface ProtonTherapy {
  coverage?: string;
  reimbursementRatio?: string;
}

export interface ParsedInsurance {
  company?: string;
  productName?: string;
  insuranceType?: string;
  coveragePeriod?: string;
  paymentPeriod?: string;
  waitingPeriod?: string;
  generalMedical?: GeneralMedical;
  criticalIllness?: CriticalIllness;
  mildIllness?: MildIllness;
  middleIllness?: MiddleIllness;
  protonTherapy?: ProtonTherapy;
  deathCoverage?: string;
  premium?: string;
  exclusions?: string[];
}

export interface DifferenceValue {
  planId: string;
  planName: string;
  value: string;
}

export interface Difference {
  field: string;
  fieldLabel: string;
  values: DifferenceValue[];
  impact: ImpactType;
  summary?: string;
}

export interface AnalyzeProgress {
  status: TaskStatus;
  progress: number;
  message?: string;
  result?: any;
}
