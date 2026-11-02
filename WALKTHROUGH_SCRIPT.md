# ForgeFlow ERP walkthrough

**About 3 minutes.** Record your screen and voice. Use the demo data, and speak at a comfortable pace. The lines below are written to sound like a straightforward explanation of your project, not a sales pitch.

## Before you start

- Open the [live demo](https://forgeflow-erp-theta.vercel.app/dashboard) and make sure the assignment data is there.
- If you changed the data, go to **History → Reset demo data** first.
- Close unrelated tabs and start on the dashboard. Keep the browser zoom high enough for the text to be clear.
- This is a local demo, so use only the sample data.

## Walkthrough

### 0:00–0:20 · Start on the dashboard

**Show:** The dashboard and the featured order card.

**Say:**  
“Hi, this is ForgeFlow ERP. I built it around the subcontracting scenario in the assignment. I’ll walk through how one order moves from the vendor, back into the warehouse, through inspection, and finally to the customer.”

### 0:20–0:55 · Explain the quantities

**Show:** Point to the material flow and the delivery risk on the dashboard.

**Say:**  
“This order needs 1,000 units, and there’s no finished stock available at the start. We sent all 1,000 to the vendor. The vendor says 800 have come back, but the warehouse has only counted 780. Inspection accepted 740 and held 40. Since nothing has shipped yet, the dashboard shows that the order is still short for delivery.”

### 0:55–1:25 · Open the order

**Show:** Open the featured order. Point to the progress steps and the recommended next step. Scroll to show the dispatch, invoice, and shipment sections.

**Say:**  
“Here, I can see the whole order in one place. Each step has its own quantity. That matters because a vendor update doesn’t mean the goods have arrived, and an invoice doesn’t mean they’ve passed inspection. The page also tells the operator what to do next based on what’s still outstanding.”

### 1:25–1:55 · Show warehouse and quality

**Show:** Go back to all orders, then open **Warehouse receipts** and **Quality** from the sidebar. Point to the receipt and inspection quantities.

**Say:**  
“At the warehouse, we record what physically arrived. Then quality splits that receipt into accepted and rejected units. Those two numbers have to add up to the receipt total. Only accepted units can be shipped; rejected or uninspected units stay out of available stock.”

### 1:55–2:25 · Show reconciliation

**Show:** Open **Reconciliation** and point to the vendor report, dispatch, receipt, accepted, and invoice quantities. Don’t submit a resolution.

**Say:**  
“This screen helps explain the differences. In this example, the vendor reported 800 units, but the warehouse received 780, so 20 units still need follow-up. If the team resolves the report, they have to add a note describing what was agreed or what happens next.”

### 2:25–2:50 · Explain the import and its limits

**Show:** Open **Imports** and point to the CSV import options. Or show the integration plan in the README.

**Say:**  
“I’ve also included a CSV flow to demonstrate vendor updates, duplicate checks, and retrying failed rows. It’s a demo, though—the import doesn’t connect to a real vendor system, and the app stores data in this browser. The integration plan explains how I’d connect it to real systems safely.”

### 2:50–3:00 · Finish

**Show:** Return to the dashboard and leave it on screen.

**Say:**  
“That’s the main flow. The important thing is that we keep reported, received, accepted, and shipped quantities separate, so the team can see what’s really happening and act on the gaps.”

## Quick recording tips

- Move the pointer only when you’re pointing something out.
- Don’t rush the quantity explanation; it’s the heart of the demo.
- If you stumble, pause and start that sentence again. You can edit the pause out later.
- Check that the text is readable and your voice is clear before submitting the recording.
