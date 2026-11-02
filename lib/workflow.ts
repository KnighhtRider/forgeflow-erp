import type { ForgeData, ProductionOrder } from "./domain";

export type OrderFlow = {
  dispatched: number;
  reported: number;
  overReported: number;
  received: number;
  accepted: number;
  rejected: number;
  invoiced: number;
  shipped: number;
  available: number;
  stillAtVendor: number;
  inTransit: number;
  remainingToShip: number;
  notYetReceived: number;
  reportVsReceipt: number;
  invoiceVsReport: number;
  acceptedShortfall: number;
  deliveryDueDate: string;
};

export function calculateOrderFlow(data: ForgeData, order: ProductionOrder): OrderFlow {
  const dispatches = data.dispatches.filter((item) => item.orderId === order.id);
  const receipts = data.receipts.filter((item) => item.orderId === order.id);
  const receiptIds = new Set(receipts.map((item) => item.id));
  const inspections = data.inspections.filter((item) => receiptIds.has(item.receiptId));
  const dispatched = dispatches.reduce((sum, item) => sum + item.quantity, 0);
  const reported = data.reconciliations.filter((item) => item.orderId === order.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.reported ?? 0;
  // A vendor statement can exceed dispatch, but the excess is an exception—not material in transit.
  const reportAppliedToFlow = Math.min(reported, dispatched);
  const received = receipts.reduce((sum, item) => sum + item.quantity, 0);
  const accepted = inspections.reduce((sum, item) => sum + item.accepted, 0);
  const rejected = inspections.reduce((sum, item) => sum + item.rejected, 0);
  const invoiced = data.invoices.filter((item) => item.orderId === order.id).reduce((sum, item) => sum + item.quantity, 0);
  const shipped = data.shipments.filter((item) => item.orderId === order.id).reduce((sum, item) => sum + item.quantity, 0);
  return {
    dispatched,
    reported,
    overReported: Math.max(0, reported - dispatched),
    received,
    accepted,
    rejected,
    invoiced,
    shipped,
    available: Math.max(0, accepted - shipped),
    stillAtVendor: Math.max(0, dispatched - reportAppliedToFlow),
    inTransit: Math.max(0, reportAppliedToFlow - received),
    remainingToShip: Math.max(0, order.quantity - shipped),
    notYetReceived: Math.max(0, order.quantity - received),
    reportVsReceipt: reported - received,
    invoiceVsReport: invoiced - reported,
    acceptedShortfall: Math.max(0, order.quantity - accepted),
    deliveryDueDate: order.shipmentDueDate ?? order.dueDate,
  };
}

export function calculateReconciliationProgress(data: ForgeData, report: ForgeData["reconciliations"][number]) {
  const order = data.orders.find((item) => item.id === report.orderId);
  if (!order) return undefined;
  const flow = calculateOrderFlow(data, order);
  return {
    received: flow.received,
    accepted: flow.accepted,
    rejected: flow.rejected,
    invoiced: flow.invoiced,
    reportedOutstanding: Math.max(0, report.reported - flow.received),
    receivedAboveReport: Math.max(0, flow.received - report.reported),
  };
}

export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let closedQuote = false;
  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') { field += '"'; index++; }
      else if (char === '"') { quoted = false; closedQuote = true; }
      else field += char;
    } else if (char === '"') {
      if (field.length || closedQuote) throw new Error("A quote may only start an empty CSV field.");
      quoted = true;
    } else if (char === ",") {
      row.push(field); field = ""; closedQuote = false;
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[index + 1] === "\n") index++;
      row.push(field); field = ""; closedQuote = false;
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
    } else { if (closedQuote) throw new Error("Unexpected characters after a quoted CSV field."); field += char; }
  }
  if (quoted) throw new Error("A quoted CSV field is not closed.");
  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  return rows;
}

export function serializeCsvRow(values: string[]): string {
  return values.map((value) => /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value).join(",");
}

export function normalizeExternalId(value: string): string {
  return value.trim().normalize("NFKC").toLocaleLowerCase("en-US");
}

export type VendorUpdatePreview =
  | { ok: false; error: string }
  | { ok: true; headers: string[]; rows: number; accepted: Array<{ externalId: string; orderId: string; vendorId: string; reported: number }>; failedRows: string[][]; failureDetails: string[]; skipped: number };

export function previewVendorUpdateImport(data: ForgeData, payload: string, simulateOutage = false): VendorUpdatePreview {
  if (new TextEncoder().encode(payload).byteLength > 1_500_000) return { ok: false, error: "CSV is larger than the 1.5 MB local demo limit." };
  let records: string[][];
  try { records = parseCsv(payload); } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "CSV could not be parsed." }; }
  if (records.length < 2) return { ok: false, error: "Add a header and at least one update row." };
  if (records.length - 1 > 10000) return { ok: false, error: "A batch is limited to 10,000 data rows in this local demo." };
  const headers = records[0].map((cell) => cell.trim().replace(/^\uFEFF/, "").toLowerCase());
  const required = ["externalid", "vendorcode", "ordercode", "reportedqty"];
  if (new Set(headers).size !== headers.length || required.some((name) => headers.indexOf(name) < 0)) return { ok: false, error: "CSV must contain unique externalId, vendorCode, orderCode, and reportedQty columns." };
  const col = (name: string) => headers.indexOf(name.toLowerCase());
  const accepted: Array<{ externalId: string; orderId: string; vendorId: string; reported: number }> = [];
  const failedRows: string[][] = []; const failureDetails: string[] = [];
  const imported = new Set([...data.imports.flatMap((batch) => batch.externalIds), ...data.reconciliations.flatMap((item) => item.externalId ? [item.externalId] : [])].map(normalizeExternalId));
  const inBatch = new Set<string>(); let skipped = 0;
  for (const row of records.slice(1)) {
    const externalId = (row[col("externalId")] ?? "").trim();
    const normalizedId = normalizeExternalId(externalId);
    if (normalizedId && (imported.has(normalizedId) || inBatch.has(normalizedId))) { skipped++; continue; }
    if (normalizedId) inBatch.add(normalizedId);
    const vendorCode = (row[col("vendorCode")] ?? "").trim();
    const orderCode = (row[col("orderCode")] ?? "").trim();
    const quantityText = (row[col("reportedQty")] ?? "").trim();
    const quantity = Number(quantityText);
    const vendor = data.vendors.find((item) => item.code.trim().toLowerCase() === vendorCode.toLowerCase());
    const order = data.orders.find((item) => item.code.trim().toLowerCase() === orderCode.toLowerCase());
    const errors: string[] = [];
    if (row.length !== headers.length) errors.push("Column count does not match the header.");
    if (!externalId) errors.push("External ID is required.");
    if (!vendor) errors.push("Vendor code was not found.");
    if (!order) errors.push("Order code was not found.");
    if (vendor && order && order.vendorId !== vendor.id) errors.push("Vendor does not match the selected order.");
    if (!Number.isSafeInteger(quantity) || quantity < 0) errors.push("Reported quantity must be a non-negative whole number.");
    if (!errors.length && simulateOutage) errors.push("Simulated vendor integration outage.");
    if (errors.length) {
      failedRows.push(row);
      failureDetails.push((externalId || "Missing external ID") + ": " + errors.join(" "));
      continue;
    }
    accepted.push({ externalId, orderId: order!.id, vendorId: vendor!.id, reported: quantity });
    imported.add(normalizedId);
  }
  return { ok: true, headers: records[0], rows: records.length - 1, accepted, failedRows, failureDetails, skipped };
}

export function validPositiveInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

export type WorkflowResult<T> = { ok: true; value: T } | { ok: false; error: string };
const idFor = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
export function nextDocumentReference(prefix: "DSP" | "GRN" | "INV" | "DN", records: Array<{ reference: string }>, at = new Date().toISOString()): string {
  const year = new Date(at).getFullYear();
  const matcher = new RegExp(`^${prefix}-${year}-(\\d+)$`, "i");
  const sequence = records.reduce((max, item) => Math.max(max, Number(item.reference.match(matcher)?.[1] ?? 0)), 0) + 1;
  return `${prefix}-${year}-${String(sequence).padStart(4, "0")}`;
}
export function nextVendorCode(vendors: Array<{ code: string }>): string {
  const sequence = vendors.reduce((max, vendor) => Math.max(max, Number(vendor.code.match(/^VND-(\d+)$/i)?.[1] ?? 0)), 0) + 1;
  return `VND-${String(sequence).padStart(3, "0")}`;
}
const uniqueReference = (values: Array<{ reference: string }>, reference: string) => {
  const normalized = reference.trim().normalize("NFKC").toLocaleLowerCase("en-US");
  return normalized.length > 0 && !values.some((item) => item.reference.trim().normalize("NFKC").toLocaleLowerCase("en-US") === normalized);
};

export function recordDispatch(data: ForgeData, orderId: string, quantity: number, reference?: string, at = new Date().toISOString()): WorkflowResult<ForgeData> {
  const order = data.orders.find((item) => item.id === orderId);
  if (!order) return { ok: false, error: "Select a valid production order." };
  if (!validPositiveInteger(quantity)) return { ok: false, error: "Dispatch quantity must be a positive whole number." };
  const documentReference = reference?.trim() || nextDocumentReference("DSP", data.dispatches, at);
  if (!uniqueReference(data.dispatches.filter((item) => item.orderId === orderId), documentReference)) return { ok: false, error: "Dispatch reference must be unique for this order." };
  const total = data.dispatches.filter((item) => item.orderId === orderId).reduce((sum, item) => sum + item.quantity, 0);
  if (total + quantity > order.quantity) return { ok: false, error: "Total dispatched quantity cannot exceed the production order quantity." };
  return { ok: true, value: { ...data, dispatches: [{ id: idFor("dsp"), orderId, quantity, reference: documentReference, dispatchedAt: at }, ...data.dispatches] } };
}

export function recordReceipt(data: ForgeData, orderId: string, quantity: number, reference?: string, at = new Date().toISOString()): WorkflowResult<ForgeData> {
  const order = data.orders.find((item) => item.id === orderId);
  if (!order) return { ok: false, error: "Select a valid production order." };
  if (!validPositiveInteger(quantity)) return { ok: false, error: "Receipt quantity must be a positive whole number." };
  const documentReference = reference?.trim() || nextDocumentReference("GRN", data.receipts, at);
  if (!uniqueReference(data.receipts.filter((item) => item.orderId === orderId), documentReference)) return { ok: false, error: "Receipt reference must be unique for this order." };
  const dispatched = data.dispatches.filter((item) => item.orderId === orderId).reduce((sum, item) => sum + item.quantity, 0);
  const received = data.receipts.filter((item) => item.orderId === orderId).reduce((sum, item) => sum + item.quantity, 0);
  if (!dispatched || received + quantity > dispatched) return { ok: false, error: "Receipts cannot exceed the quantity dispatched to the vendor." };
  return { ok: true, value: { ...data, receipts: [{ id: idFor("rcv"), orderId, vendorId: order.vendorId, quantity, reference: documentReference, receivedAt: at }, ...data.receipts] } };
}

export function recordInspection(data: ForgeData, receiptId: string, accepted: number, rejected: number, notes: string, at = new Date().toISOString()): WorkflowResult<ForgeData> {
  const receipt = data.receipts.find((item) => item.id === receiptId);
  if (!receipt) return { ok: false, error: "Select a valid receipt." };
  if (data.inspections.some((item) => item.receiptId === receiptId)) return { ok: false, error: "This receipt has already been inspected." };
  if (![accepted, rejected].every(Number.isSafeInteger) || accepted < 0 || rejected < 0 || accepted + rejected !== receipt.quantity) return { ok: false, error: "Accepted and rejected quantities must be non-negative whole numbers that add up to the receipt quantity." };
  if (rejected > 0 && !notes.trim()) return { ok: false, error: "Add a defect or disposition note when any units are rejected or held." };
  return { ok: true, value: { ...data, inspections: [{ id: idFor("insp"), receiptId, accepted, rejected, notes: notes.trim(), inspectedAt: at }, ...data.inspections] } };
}

export function recordInvoice(data: ForgeData, orderId: string, quantity: number, reference?: string, at = new Date().toISOString(), supplierReference?: string): WorkflowResult<ForgeData> {
  const order = data.orders.find((item) => item.id === orderId);
  if (!order) return { ok: false, error: "Select a valid production order." };
  if (!validPositiveInteger(quantity)) return { ok: false, error: "Invoice quantity must be a positive whole number." };
  const documentReference = reference?.trim() || nextDocumentReference("INV", data.invoices, at);
  if (!uniqueReference(data.invoices.filter((item) => item.orderId === orderId), documentReference)) return { ok: false, error: "Invoice reference must be unique for this order." };
  const normalizedSupplierReference = supplierReference?.trim();
  if (normalizedSupplierReference && data.invoices.some((item) => item.vendorId === order.vendorId && item.supplierReference?.trim().normalize("NFKC").toLocaleLowerCase("en-US") === normalizedSupplierReference.normalize("NFKC").toLocaleLowerCase("en-US"))) return { ok: false, error: "That supplier invoice number is already recorded for this vendor." };
  // Invoice quantities may differ from reported or received quantities; preserve the variance for review.
  return { ok: true, value: { ...data, invoices: [{ id: idFor("inv"), orderId, vendorId: order.vendorId, quantity, reference: documentReference, receivedAt: at, ...(normalizedSupplierReference ? { supplierReference: normalizedSupplierReference } : {}) }, ...data.invoices] } };
}

export function recordShipment(data: ForgeData, orderId: string, quantity: number, reference?: string, at = new Date().toISOString()): WorkflowResult<ForgeData> {
  const order = data.orders.find((item) => item.id === orderId);
  if (!order) return { ok: false, error: "Select a valid production order." };
  if (!validPositiveInteger(quantity)) return { ok: false, error: "Shipment quantity must be a positive whole number." };
  const documentReference = reference?.trim() || nextDocumentReference("DN", data.shipments, at);
  if (!uniqueReference(data.shipments.filter((item) => item.orderId === orderId), documentReference)) return { ok: false, error: "Shipment reference must be unique for this order." };
  const flow = calculateOrderFlow(data, order);
  if (quantity > flow.available) return { ok: false, error: `Shipment cannot exceed inspected accepted stock (${flow.available} units available).` };
  return { ok: true, value: { ...data, shipments: [{ id: idFor("shp"), orderId, quantity, reference: documentReference, shippedAt: at }, ...data.shipments] } };
}
