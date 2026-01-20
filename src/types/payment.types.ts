import { PaymentMethod, PaymentStatus, Currency } from '@prisma/client';

export interface CreateTransactionDTO {
  reservationId: string;
  amount: number;       // Monto en la moneda pagada (ej. 1500.00 Bs)
  currency: Currency;   // VES o USD
  exchangeRate: number; // La tasa usada (ej. 36.50)
  referenceId: string;  // "123456"
  method: PaymentMethod;
  notes?: string;
}

export interface VerifyTransactionDTO {
  transactionId: string;
  status: PaymentStatus; // VERIFIED o REJECTED
  managerId: string;     // Quién lo validó
}