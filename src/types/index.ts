export interface MasterItem {
  id: string;
  name: string;
  description: string;
  unit: string; // pcs, kg, box, etc
  defaultRate: number;
  category: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  address: string;
  city: string;
  ntncn: string;
  creditLimit: number;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  contact: string;
  address: string;
  city: string;
  ntncn: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  delivered: number;
  pending: number;
  unit: string;
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

export interface DeliveryItem {
  id: string;
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  orderId?: string;
  orderItemId?: string;
}

export interface DeliveryNote {
  id: string;
  deliveryNumber: string;
  orderId: string;
  customerId: string;
  customerName: string;
  date: string;
  items: DeliveryItem[];
  transportMode: string;
  trackingNumber: string;
  status: 'dispatched' | 'delivered';
  invoiced: boolean;
  invoiceId?: string;
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
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  unit: string;
  deliveryNoteId?: string;
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
  deliveryNoteIds: string[];
  orderId?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
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
  poNumber: string;
  vendorId: string;
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

export interface CreditNote {
  id: string;
  cnNumber: string;
  customerId: string;
  customerName: string;
  invoiceId: string;
  date: string;
  amount: number;
  reason: string;
  items: { description: string; quantity: number; rate: number; amount: number }[];
}

export interface AppState {
  masterItems: MasterItem[];
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
  creditNotes: CreditNote[];
}
