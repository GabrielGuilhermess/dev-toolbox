export interface CpfValidationResult {
  valid: boolean;
  formatted: string;
  digits: {
    first: number;
    second: number;
  };
}
