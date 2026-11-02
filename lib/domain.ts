export type OrderStatus = "Pending" | "In Progress" | "Blocked" | "Completed" | "Shipped";
export type VendorStatus = "Active" | "On Hold";

export type ProductionOrder = {
  id: string;
  code: string;
  product: string;
  quantity: number;
  dueDate: string;
  vendorId: string;
  status: OrderStatus;
  createdAt: string;
  customerOrderCode?: string;
  customerName?: string;
  shipmentDueDate?: string;
};
export type Vendor = { id: string; code: string; name: string; contact: string; email: string; status: VendorStatus };
export type Dispatch = { id: string; orderId: string; quantity: number; dispatchedAt: string; reference: string };
export type Receipt = { id: string; orderId: string; vendorId: string; quantity: number; receivedAt: string; reference: string };
export type Inspection = { id: string; receiptId: string; accepted: number; rejected: number; notes: string; inspectedAt: string };
export type VendorInvoice = { id: string; orderId: string; vendorId: string; quantity: number; reference: string; receivedAt: string; supplierReference?: string };
export type Shipment = { id: string; orderId: string; quantity: number; shippedAt: string; reference: string };
export type Reconciliation = { id: string; orderId: string; vendorId: string; reported: number; received: number; accepted: number; status: "Open" | "Resolved"; createdAt: string; dispatched?: number; invoiced?: number; externalId?: string; resolutionNote?: string; resolvedAt?: string };
export type ImportBatch = { id: string; fileName: string; importedAt: string; rows: number; accepted: number; skipped: number; failed: number; payload: string; externalIds: string[]; failureDetails?: string[] };
export type Activity = { id: string; action: string; detail: string; createdAt: string };
export type ForgeData = {
  orders: ProductionOrder[];
  vendors: Vendor[];
  dispatches: Dispatch[];
  receipts: Receipt[];
  inspections: Inspection[];
  invoices: VendorInvoice[];
  shipments: Shipment[];
  reconciliations: Reconciliation[];
  imports: ImportBatch[];
  history: Activity[];
};

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";
const isNonNegativeInteger = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0;
const isIsoDate = (value: unknown): value is string => isString(value) && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const isTimestamp = (value: unknown): value is string => isString(value) && !Number.isNaN(Date.parse(value));
const hasId = (value: unknown) => isRecord(value) && isString(value.id) && value.id.length > 0;

export function isForgeData(value: unknown): value is ForgeData {
  if (!isRecord(value)) return false;
  const collections = ["orders", "vendors", "dispatches", "receipts", "inspections", "invoices", "shipments", "reconciliations", "imports", "history"] as const;
  if (!collections.every((key) => Array.isArray(value[key]) && (value[key] as unknown[]).every(hasId))) return false;
  const data = value as unknown as ForgeData;
  const uniqueIds = collections.every((key) => new Set(data[key].map((item) => item.id)).size === data[key].length);
  if (!uniqueIds) return false;
  const vendorIds = new Set(data.vendors.map((item) => item.id));
  const orderIds = new Set(data.orders.map((item) => item.id));
  const receiptIds = new Set(data.receipts.map((item) => item.id));
  const structurallyValid = data.orders.every((x) => isString(x.code) && x.code.trim().length > 0 && isString(x.product) && x.product.trim().length > 0 && isNonNegativeInteger(x.quantity) && x.quantity > 0 && isIsoDate(x.dueDate) && vendorIds.has(x.vendorId) && ["Pending", "In Progress", "Blocked", "Completed", "Shipped"].includes(x.status) && isTimestamp(x.createdAt) && (x.customerOrderCode === undefined || isString(x.customerOrderCode)) && (x.customerName === undefined || isString(x.customerName)) && (x.shipmentDueDate === undefined || isIsoDate(x.shipmentDueDate)))
    && data.vendors.every((x) => isString(x.code) && x.code.trim().length > 0 && isString(x.name) && x.name.trim().length > 0 && isString(x.contact) && isString(x.email) && ["Active", "On Hold"].includes(x.status))
    && data.dispatches.every((x) => orderIds.has(x.orderId) && isNonNegativeInteger(x.quantity) && x.quantity > 0 && isString(x.reference) && isTimestamp(x.dispatchedAt))
    && data.receipts.every((x) => orderIds.has(x.orderId) && vendorIds.has(x.vendorId) && isNonNegativeInteger(x.quantity) && x.quantity > 0 && isString(x.reference) && isTimestamp(x.receivedAt))
    && data.inspections.every((x) => receiptIds.has(x.receiptId) && isNonNegativeInteger(x.accepted) && isNonNegativeInteger(x.rejected) && isString(x.notes) && isTimestamp(x.inspectedAt))
    && data.invoices.every((x) => orderIds.has(x.orderId) && vendorIds.has(x.vendorId) && isNonNegativeInteger(x.quantity) && x.quantity > 0 && isString(x.reference) && isTimestamp(x.receivedAt) && (x.supplierReference === undefined || (isString(x.supplierReference) && x.supplierReference.trim().length > 0)))
    && data.shipments.every((x) => orderIds.has(x.orderId) && isNonNegativeInteger(x.quantity) && x.quantity > 0 && isString(x.reference) && isTimestamp(x.shippedAt))
    && data.reconciliations.every((x) => orderIds.has(x.orderId) && vendorIds.has(x.vendorId) && isNonNegativeInteger(x.reported) && isNonNegativeInteger(x.received) && isNonNegativeInteger(x.accepted) && x.accepted <= x.received && (x.dispatched === undefined || (isNonNegativeInteger(x.dispatched) && x.received <= x.dispatched)) && (x.invoiced === undefined || isNonNegativeInteger(x.invoiced)) && ["Open", "Resolved"].includes(x.status) && isTimestamp(x.createdAt) && (x.externalId === undefined || (isString(x.externalId) && x.externalId.trim().length > 0)) && (x.resolutionNote === undefined || isString(x.resolutionNote)) && (x.resolvedAt === undefined || isTimestamp(x.resolvedAt)) && (x.status !== "Resolved" || (isString(x.resolutionNote) && x.resolutionNote.trim().length > 0 && isTimestamp(x.resolvedAt))))
    && data.imports.every((x) => isString(x.fileName) && isTimestamp(x.importedAt) && isString(x.payload) && [x.rows, x.accepted, x.skipped, x.failed].every(isNonNegativeInteger) && x.accepted + x.skipped + x.failed === x.rows && Array.isArray(x.externalIds) && x.externalIds.every((id) => isString(id) && id.trim().length > 0) && x.externalIds.length === x.accepted && (x.failureDetails === undefined || (Array.isArray(x.failureDetails) && x.failureDetails.length === x.failed && x.failureDetails.every(isString))))
    && data.history.every((x) => isString(x.action) && isString(x.detail) && isTimestamp(x.createdAt));
  if (!structurallyValid) return false;
  const uniqueReferences = <T extends { orderId: string; reference: string }>(items: T[]) => items.every((item, index) => item.reference.trim().length > 0 && items.findIndex((other) => other.orderId === item.orderId && other.reference.trim().normalize("NFKC").toLocaleLowerCase("en-US") === item.reference.trim().normalize("NFKC").toLocaleLowerCase("en-US")) === index);
  if (!uniqueReferences(data.dispatches) || !uniqueReferences(data.receipts) || !uniqueReferences(data.invoices) || !uniqueReferences(data.shipments)) return false;
  const supplierInvoiceReferences = data.invoices.flatMap((invoice) => invoice.supplierReference ? [{ vendorId: invoice.vendorId, reference: invoice.supplierReference.trim().normalize("NFKC").toLocaleLowerCase("en-US") }] : []);
  if (supplierInvoiceReferences.some((item, index) => supplierInvoiceReferences.findIndex((other) => other.vendorId === item.vendorId && other.reference === item.reference) !== index)) return false;
  for (const order of data.orders) {
    const dispatched = data.dispatches.filter((item) => item.orderId === order.id).reduce((sum, item) => sum + item.quantity, 0);
    const receipts = data.receipts.filter((item) => item.orderId === order.id);
    const received = receipts.reduce((sum, item) => sum + item.quantity, 0);
    const accepted = data.inspections.filter((item) => receipts.some((receipt) => receipt.id === item.receiptId)).reduce((sum, item) => sum + item.accepted, 0);
    const shipped = data.shipments.filter((item) => item.orderId === order.id).reduce((sum, item) => sum + item.quantity, 0);
    if (dispatched > order.quantity || received > dispatched || shipped > accepted) return false;
    if (order.status === "Shipped" && shipped < order.quantity) return false;
    if (receipts.some((receipt) => receipt.vendorId !== order.vendorId)) return false;
    if (data.invoices.some((invoice) => invoice.orderId === order.id && invoice.vendorId !== order.vendorId)) return false;
    if (data.reconciliations.some((item) => item.orderId === order.id && item.vendorId !== order.vendorId)) return false;
  }
  if (data.receipts.some((receipt) => data.inspections.some((item) => item.receiptId === receipt.id && item.accepted + item.rejected !== receipt.quantity))) return false;
  const importedExternalIds = data.imports.flatMap((batch) => batch.externalIds).map((id) => id.trim().normalize("NFKC").toLocaleLowerCase("en-US"));
  const reconciliationExternalIds = data.reconciliations.flatMap((item) => item.externalId ? [item.externalId] : []).map((id) => id.trim().normalize("NFKC").toLocaleLowerCase("en-US"));
  if (new Set(importedExternalIds).size !== importedExternalIds.length || new Set(reconciliationExternalIds).size !== reconciliationExternalIds.length) return false;
  if (importedExternalIds.some((id) => reconciliationExternalIds.filter((other) => other === id).length !== 1)) return false;
  for (const order of data.orders) {
    const sums = [data.dispatches.filter((item) => item.orderId === order.id), data.receipts.filter((item) => item.orderId === order.id), data.invoices.filter((item) => item.orderId === order.id), data.shipments.filter((item) => item.orderId === order.id)];
    if (sums.some((items) => !Number.isSafeInteger(items.reduce((sum, item) => sum + item.quantity, 0)))) return false;
  }
  return true;
}

const now = new Date();
const date = (offset: number) => { const d = new Date(now); d.setDate(d.getDate() + offset); return toDateInputValue(d); };
const nowIso = now.toISOString();

// Deliberately mirrors the assignment's reconciliation case. All differences remain visible.
export const seedData: ForgeData = {
  vendors: [{ id: "v-001", code: "VND-101", name: "Apex Heat Treatment Works", contact: "Ravi Shah", email: "ops@apexheat.example", status: "Active" }],
  orders: [{ id: "o-1001", code: "PO-2026-1001", product: "Finished auto component (heat treatment)", quantity: 1000, dueDate: date(2), vendorId: "v-001", status: "In Progress", createdAt: nowIso, customerOrderCode: "SO-2026-042", customerName: "Western Motors", shipmentDueDate: date(2) }],
  dispatches: [{ id: "d-1001", orderId: "o-1001", quantity: 1000, dispatchedAt: nowIso, reference: "CH-1001" }],
  receipts: [{ id: "r-2001", orderId: "o-1001", vendorId: "v-001", quantity: 780, receivedAt: nowIso, reference: "GRN-7841" }],
  inspections: [{ id: "q-3001", receiptId: "r-2001", accepted: 740, rejected: 40, notes: "40 units held pending vendor rework disposition.", inspectedAt: nowIso }],
  invoices: [{ id: "i-6001", orderId: "o-1001", vendorId: "v-001", quantity: 800, reference: "INV-HT-800", receivedAt: nowIso }],
  shipments: [],
  reconciliations: [{ id: "c-4001", orderId: "o-1001", vendorId: "v-001", reported: 800, dispatched: 1000, received: 780, accepted: 740, invoiced: 800, status: "Open", createdAt: nowIso, externalId: "ASN-800" }],
  imports: [],
  history: [{ id: "a-5001", action: "Assignment scenario loaded", detail: "SO-2026-042 requires 1,000 units in 2 days. Vendor dispatch 1,000; vendor report 800; received 780; accepted 740; rejected 40; invoice quantity 800. No opening finished stock.", createdAt: nowIso }],
};

export const makeId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
export function toDateInputValue(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
export const formatDate = (value: string) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
export const formatNumber = (value: number) => new Intl.NumberFormat("en-IN").format(value);
