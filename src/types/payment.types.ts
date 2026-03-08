export interface CreateTransactionDTO {
  reservationId: string;
  amount: number;
  currency: 'USD' | 'VES';
  referenceId: string;
  // Campos para Venezuela
  senderBank?: string;
  senderPhone?: string;
  senderEmail?: string;
  metadata?: any; // Aquí recibimos el JSON con la URL de la imagen del frontend
}

export interface VerifyTransactionDTO {
  transactionId: string;
  status: 'VERIFIED' | 'REJECTED';
  managerId: string;
}