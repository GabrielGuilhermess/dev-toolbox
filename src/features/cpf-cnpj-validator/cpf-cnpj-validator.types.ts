export interface DocumentValidationResult {
  type: 'cpf' | 'cnpj';
  valid: boolean;
  formatted: string;
}
