import test from "node:test";
import assert from "node:assert/strict";
import { seedData, isForgeData } from "../lib/domain.ts";
import { calculateOrderFlow, calculateReconciliationProgress, nextDocumentReference, nextVendorCode, normalizeExternalId, parseCsv, previewVendorUpdateImport, recordDispatch, recordInspection, recordInvoice, recordReceipt, recordShipment, serializeCsvRow } from "../lib/workflow.ts";

const order = seedData.orders[0];
const clone = () => structuredClone(seedData);

test("seeded assignment workflow preserves each independent quantity", () => {
  const flow = calculateOrderFlow(seedData, order);
  assert.deepEqual({ demand: order.quantity, dispatched: flow.dispatched, reported: flow.reported, overReported: flow.overReported, received: flow.received, accepted: flow.accepted, rejected: flow.rejected, invoiced: flow.invoiced, shipped: flow.shipped, available: flow.available, reportGap: flow.reportVsReceipt, invoiceReceiptGap: flow.invoiced - flow.received, invoiceAcceptedGap: flow.invoiced - flow.accepted, missingSupply: flow.acceptedShortfall, vendorHeld: flow.stillAtVendor, inTransit: flow.inTransit }, {
    demand: 1000, dispatched: 1000, reported: 800, overReported: 0, received: 780, accepted: 740, rejected: 40, invoiced: 800, shipped: 0, available: 740, reportGap: 20, invoiceReceiptGap: 20, invoiceAcceptedGap: 60, missingSupply: 260, vendorHeld: 200, inTransit: 20,
  });
  assert.equal(isForgeData(seedData), true);
});

test("dispatches and receipts enforce positive integer quantities, caps, and unique references", () => {
  const data = clone();
  assert.equal(recordDispatch(data, order.id, 1, "EXTRA").ok, false);
  assert.equal(recordDispatch(data, order.id, 0, "ZERO").ok, false);
  assert.equal(recordDispatch(data, order.id, 1.5, "FRACTION").ok, false);
  assert.equal(recordReceipt(data, order.id, 221, "GRN-OVER").ok, false);
  assert.equal(recordReceipt(data, order.id, 1, " grn-7841 ").ok, false);
  const result = recordReceipt(data, order.id, 20, "GRN-7842");
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(calculateOrderFlow(result.value, order).received, 800);
});

test("inspection must account for every received unit exactly once", () => {
  const data = clone();
  assert.equal(recordInspection(data, "r-2001", 739, 40, "").ok, false);
  assert.equal(recordInspection(data, "r-2001", 740, 40, "").ok, false);
  assert.equal(recordInspection(data, "r-2001", Number.MAX_SAFE_INTEGER + 1, 0, "").ok, false);
  assert.equal(recordInspection(data, "missing", 0, 0, "").ok, false);
  const extraReceipt = recordReceipt(data, order.id, 20, "GRN-7842");
  assert.equal(extraReceipt.ok, true);
  if (extraReceipt.ok) {
    const receiptId = extraReceipt.value.receipts[0].id;
    assert.equal(recordInspection(extraReceipt.value, receiptId, 15, 5, "").ok, false);
    assert.equal(recordInspection(extraReceipt.value, receiptId, 15, 5, "5 units with surface defects; held for vendor disposition.").ok, true);
    assert.equal(recordInspection(extraReceipt.value, receiptId, 20, 0, "follow-up inspection").ok, true);
  }
  assert.equal(recordInspection(data, "r-2001", 740, 40, "repeat").ok, false);
});

test("invoice mismatches are retained while malformed quantities and duplicate references are rejected", () => {
  const data = clone();
  assert.equal(recordInvoice(data, order.id, 0, "INV-0").ok, false);
  assert.equal(recordInvoice(data, order.id, -1, "INV-NEG").ok, false);
  assert.equal(recordInvoice(data, order.id, 1.25, "INV-FRACTION").ok, false);
  assert.equal(recordInvoice(data, order.id, 800, " inv-ht-800 ").ok, false);
  const result = recordInvoice(data, order.id, 900, "INV-EXCESS");
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(calculateOrderFlow(result.value, order).invoiced, 1700);
});

test("customer shipments can only consume accepted unsent stock", () => {
  const data = clone();
  assert.equal(recordShipment(data, order.id, 741, "SHP-TOO-MANY").ok, false);
  assert.equal(recordShipment(data, order.id, 0, "SHP-ZERO").ok, false);
  const first = recordShipment(data, order.id, 700, "SHP-1");
  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.equal(calculateOrderFlow(first.value, order).available, 40);
  const second = recordShipment(first.value, order.id, 40, "SHP-2");
  assert.equal(second.ok, true);
  if (!second.ok) return;
  assert.equal(recordShipment(second.value, order.id, 1, "SHP-3").ok, false);
  assert.equal(isForgeData({ ...second.value, shipments: [...second.value.shipments, { id: "bad-shipment", orderId: order.id, quantity: 1, reference: "BAD", shippedAt: new Date().toISOString() }] }), false);
});

test("CSV parser handles quotes, commas, multiline values, and rejects malformed quoting", () => {
  const records = parseCsv('externalId,vendorCode,orderCode,reportedQty,note\r\n"Id, 1",VND-101,PO-2026-1001,800,"heat-treated ""A""\nlot"\r\n');
  assert.deepEqual(records, [["externalId", "vendorCode", "orderCode", "reportedQty", "note"], ["Id, 1", "VND-101", "PO-2026-1001", "800", 'heat-treated "A"\nlot']]);
  assert.equal(parseCsv(serializeCsvRow(records[1]))[0][0], "Id, 1");
  assert.throws(() => parseCsv('a,b\n"unfinished,x'), /not closed/);
  assert.throws(() => parseCsv('a,b\n"closed"tail,x'), /Unexpected/);
  assert.equal(normalizeExternalId("  ASN-800 "), "asn-800");
});

test("vendor update imports are idempotent, case-insensitive, and retain retryable failures", () => {
  const seedDuplicate = previewVendorUpdateImport(seedData, "externalId,vendorCode,orderCode,reportedQty\nASN-800,VND-101,PO-2026-1001,800");
  assert.equal(seedDuplicate.ok, true);
  if (!seedDuplicate.ok) return;
  assert.equal(seedDuplicate.skipped, 1);
  assert.equal(seedDuplicate.accepted.length, 0);

  const repeated = previewVendorUpdateImport(seedData, "externalId,vendorCode,orderCode,reportedQty\nNEW-1,VND-101,PO-2026-1001,800\nnew-1,VND-101,PO-2026-1001,900");
  assert.equal(repeated.ok, true);
  if (!repeated.ok) return;
  assert.equal(repeated.accepted.length, 1);
  assert.equal(repeated.skipped, 1);
  const afterFirstImport = { ...seedData, reconciliations: [...repeated.accepted.map((row) => ({ id: "new-rec", ...row, received: 780, accepted: 740, status: "Open", createdAt: new Date().toISOString() })), ...seedData.reconciliations], imports: [{ id: "new-batch", fileName: "first.csv", importedAt: new Date().toISOString(), rows: 1, accepted: 1, skipped: 0, failed: 0, payload: "", externalIds: ["new-1"] }, ...seedData.imports] };
  assert.equal(isForgeData(afterFirstImport), true);
  const repeatedUpload = previewVendorUpdateImport(afterFirstImport, "externalId,vendorCode,orderCode,reportedQty\nNEW-1,VND-101,PO-2026-1001,800");
  assert.equal(repeatedUpload.ok && repeatedUpload.skipped, 1);

  const outage = previewVendorUpdateImport(seedData, "reportedQty,orderCode,externalId,vendorCode\n800,PO-2026-1001,RETRY-1,VND-101", true);
  assert.equal(outage.ok, true);
  if (!outage.ok) return;
  assert.equal(outage.accepted.length, 0);
  assert.equal(outage.failedRows.length, 1);
  assert.match(outage.failureDetails[0], /Simulated vendor integration outage/);
  const retryPayload = [outage.headers, ...outage.failedRows].map(serializeCsvRow).join("\n");
  const retry = previewVendorUpdateImport(seedData, retryPayload, false);
  assert.equal(retry.ok && retry.accepted.length, 1);
});

test("vendor import validates row widths, IDs, vendor-order links, and integer quantities", () => {
  assert.equal(previewVendorUpdateImport(seedData, "externalId,externalId,vendorCode,orderCode,reportedQty\nx,x,VND-101,PO-2026-1001,1").ok, false);
  const invalid = previewVendorUpdateImport(seedData, "externalId,vendorCode,orderCode,reportedQty\n,NOPE,PO-2026-1001,1\nBAD,VND-101,PO-2026-1001,1.4\nWRONG,VND-101,PO-2026-1001,1,extra");
  assert.equal(invalid.ok, true);
  if (!invalid.ok) return;
  assert.equal(invalid.failedRows.length, 3);
  assert.match(invalid.failureDetails.join("; "), /External ID is required/);
  assert.match(invalid.failureDetails.join("; "), /Vendor code was not found/);
  assert.match(invalid.failureDetails.join("; "), /non-negative whole number/);
  assert.match(invalid.failureDetails.join("; "), /Column count/);
  const wrongVendor = previewVendorUpdateImport(seedData, "externalId,vendorCode,orderCode,reportedQty\nWRONG,VND-102,PO-2026-1001,5");
  assert.equal(wrongVendor.ok && wrongVendor.failedRows.length, 1);
  assert.equal(previewVendorUpdateImport(seedData, "externalId,vendorCode,orderCode,reportedQty\nLARGE,VND-101,PO-2026-1001," + "1".repeat(1_500_001)).ok, false);
});

test("backup validation rejects broken dates, references, and import accounting", () => {
  assert.equal(isForgeData({ ...clone(), orders: [{ ...order, dueDate: "2026-02-30" }] }), false);
  assert.equal(isForgeData({ ...clone(), receipts: [{ ...seedData.receipts[0], quantity: 1001 }] }), false);
  assert.equal(isForgeData({ ...clone(), dispatches: [{ ...seedData.dispatches[0], reference: " " }] }), false);
  assert.equal(isForgeData({ ...clone(), reconciliations: [{ ...seedData.reconciliations[0], externalId: 42 }] }), false);
  assert.equal(isForgeData({ ...clone(), imports: [{ id: "bad-batch", fileName: "bad.csv", importedAt: new Date().toISOString(), rows: 1, accepted: 1, skipped: 1, failed: 0, payload: "", externalIds: ["x"] }] }), false);
});

test("reconciliation snapshots preserve vendor over-reports and reject impossible receipt or resolution data", () => {
  const base = clone();
  const report = { ...base.reconciliations[0], reported: 5000, dispatched: 1000, received: 780, accepted: 740, invoiced: 800 };
  assert.equal(isForgeData({ ...base, reconciliations: [report] }), true);
  assert.equal(isForgeData({ ...base, reconciliations: [{ ...report, accepted: 781 }] }), false);
  assert.equal(isForgeData({ ...base, reconciliations: [{ ...report, received: 1001 }] }), false);
  assert.equal(isForgeData({ ...base, reconciliations: [{ ...report, status: "Resolved", resolutionNote: "  ", resolvedAt: new Date().toISOString() }] }), false);
  assert.equal(isForgeData({ ...base, reconciliations: [{ ...report, status: "Resolved", resolutionNote: "Vendor confirmed balance is still in transit", resolvedAt: new Date().toISOString() }] }), true);
});

test("open reconciliation outstanding quantity follows new physical receipts while preserving the report snapshot", () => {
  const data = clone();
  const report = { ...data.reconciliations[0], reported: 980, dispatched: 1000, received: 0, accepted: 0, invoiced: 0 };
  const beforeReceipt = { ...data, receipts: [], inspections: [], reconciliations: [report] };
  const before = calculateReconciliationProgress(beforeReceipt, report);
  assert.equal(before?.received, 0);
  assert.equal(before?.reportedOutstanding, 980);

  const receipt = recordReceipt(beforeReceipt, order.id, 980, "GRN-2026-0001");
  assert.equal(receipt.ok, true);
  if (receipt.ok) {
    const after = calculateReconciliationProgress(receipt.value, report);
    assert.equal(report.received, 0); // original report-time snapshot remains unchanged
    assert.equal(after?.received, 980);
    assert.equal(after?.reportedOutstanding, 0);
    assert.equal(after?.receivedAboveReport, 0);
  }
});

test("internal document references and vendor codes are generated while supplier invoice IDs remain validated", () => {
  const at = "2026-11-02T09:00:00.000Z";
  const data = clone();
  assert.equal(nextVendorCode(data.vendors), "VND-102");
  assert.equal(nextDocumentReference("GRN", data.receipts, at), "GRN-2026-0001");
  const dispatchData = { ...data, dispatches: [] };
  const dispatch = recordDispatch(dispatchData, order.id, 5, undefined, at);
  assert.equal(dispatch.ok && dispatch.value.dispatches[0].reference, "DSP-2026-0001");
  const receipt = recordReceipt(data, order.id, 20, undefined, at);
  assert.equal(receipt.ok && receipt.value.receipts[0].reference, "GRN-2026-0001");
  const invoice = recordInvoice(data, order.id, 10, undefined, at, "APEX-INV-25");
  assert.equal(invoice.ok && invoice.value.invoices[0].reference, "INV-2026-0001");
  assert.equal(invoice.ok && invoice.value.invoices[0].supplierReference, "APEX-INV-25");
  assert.equal(invoice.ok && recordInvoice(invoice.value, order.id, 10, undefined, at, " apex-inv-25 ").ok, false);
  const shipment = recordShipment(data, order.id, 1, undefined, at);
  assert.equal(shipment.ok && shipment.value.shipments[0].reference, "DN-2026-0001");
});

test("vendor report above dispatched is retained as an exception but never inflated into material in transit", () => {
  const data = clone();
  const overstatedReport = { ...data.reconciliations[0], reported: 1200 };
  const snapshot = { ...data, reconciliations: [overstatedReport] };
  const flow = calculateOrderFlow(snapshot, order);
  assert.equal(flow.reported, 1200);
  assert.equal(flow.overReported, 200);
  assert.equal(flow.inTransit, 220); // dispatched 1000 less the 780 already received
  assert.equal(flow.stillAtVendor, 0);
  assert.equal(isForgeData(snapshot), true); // keep the vendor's statement for investigation
});
