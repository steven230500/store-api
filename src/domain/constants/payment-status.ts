export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DECLINED: 'DECLINED',
  ERROR: 'ERROR',
} as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const CURRENCY = {
  COP: 'COP',
} as const;

export type Currency = (typeof CURRENCY)[keyof typeof CURRENCY];

export const ERROR_MESSAGES = {
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  TRANSACTION_NOT_FOUND: 'Transaction not found',
  WOMPI_INTEGRITY_KEY_MISSING: 'WOMPI_INTEGRITY_KEY no configurada',
  WOMPI_CONFIG_MISSING:
    'WOMPI_BASE_URL / PUBLIC_KEY / PRIVATE_KEY no configurados',
  WOMPI_ACCEPTANCE_TOKEN_MISSING:
    'No se pudo obtener acceptance_token de Wompi',
} as const;
