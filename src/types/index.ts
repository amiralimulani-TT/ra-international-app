export interface CompanyProfile {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  ntnNumber: string;
  gstNumber: string;
  bankAccounts: BankAccount[];
  logo?: string;
}

export interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  branch: string;
  type: 'cash' | 'bank';
  balance: number;
}

export interface MasterItem {
  id: string;
  name: string;
  description: string;
  unit: string;
  defaultRate: number;
  category: string;
  hsCode?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  address: string;
  city: string;
  ntnNumber?: string;
  gstNumber?: string;
  creditLimit?: number;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  contact: string;
  address: string;
  city: string;
  ntnNumber?: string;
  gstNumber?: string;
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
  hsCode?: string;
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
  hsCode?: string;
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
  hsCode?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  gstApplicable: boolean;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: 'unpaid' | 'partial' | 'paid';
  notes: string;
  deliveryNoteIds: string[];
  orderId?: string;
  paymentTerms?: string;
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
  accountId?: string;
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
  accountId?: string;
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
  accountId?: string;
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

export interface LedgerEntry {
  id: string;
  date: string;
  type: 'payment_received' | 'payment_made' | 'expense' | 'borrowing' | 'adjustment';
  accountId: string;
  amount: number;
  description: string;
  reference: string;
  partyName?: string;
}

export interface Borrowing {
  id: string;
  date: string;
  lender: string;
  amount: number;
  description: string;
  status: 'active' | 'repaid';
}

export interface InventoryAdjustment {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  previousQty: number;
  newQty: number;
  reason: string;
  notes: string;
}

export interface AppState {
  companyProfile: CompanyProfile;
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
  ledgerEntries: LedgerEntry[];
  borrowings: Borrowing[];
  inventoryAdjustments: InventoryAdjustment[];
}
