export interface Customer {
  id: string;
  name: string;
  contact: string;
  address: string;
  city: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  contact: string;
  address: string;
  city: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  delivered: number;
  pending: number;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'partial' | 'completed';
  notes: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  date: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'received' | 'partial';
  notes: string;
}

export interface DeliveryNote {
  id: string;
  deliveryNumber: string;
  orderId: string;
  customerName: string;
  date: string;
  items: { description: string; quantity: number }[];
  transportMode: string;
  trackingNumber: string;
  status: 'dispatched' | 'delivered';
}

export interface TransportReceipt {
  id: string;
  receiptNumber: string;
  deliveryNoteId: string;
  carrier: string;
  trackingNumber: string;
  amount: number;
  date: string;
  customerName: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  status: 'unpaid' | 'partial' | 'paid';
  notes: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  customerName: string;
  date: string;
  amount: number;
  method: 'cash' | 'cheque' | 'bank_transfer';
  reference: string;
  notes: string;
}

export interface VendorPayment {
  id: string;
  poId: string;
  vendorName: string;
  date: string;
  amount: number;
  method: 'cash' | 'cheque' | 'bank_transfer';
  reference: string;
  notes: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
}

export interface AppState {
  customers: Customer[];
  vendors: Vendor[];
  orders: CustomerOrder[];
  purchases: PurchaseOrder[];
  deliveries: DeliveryNote[];
  transportReceipts: TransportReceipt[];
  invoices: Invoice[];
  payments: Payment[];
  vendorPayments: VendorPayment[];
  expenses: Expense[];
}
