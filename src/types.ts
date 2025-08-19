export interface Venta {
  id: string;
  date: string; // ISO 8601 format
  clientId: string;
  productId: string;
  salespersonId: string;
  quantity: number;
  totalAmount: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  local: string;
  modalidad: 'diario' | 'semanal' | 'quincenal';
}

export interface Salesperson {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface CajaTransaction {
  id: string;
  date: string; // ISO 8601 format
  description: string;
  amount: number; // Always positive
  type: 'entrada' | 'salida';
}

export type ToastMessage = {
  message: string;
  type: 'success' | 'error';
};

export type ConfirmationModalState = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
};

export interface DailyCloseoutProps {
  ventas: Venta[];
  cajaTransactions: CajaTransaction[];
  clients: Client[];
  products: Product[];
}