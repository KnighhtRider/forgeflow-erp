# Integration plan

This plan describes a possible rollout, not connected services. ForgeFlow owns the subcontracting exception workflow; each customer's ERP, WMS, QMS, AP, and identity provider remains authoritative for its records. Confirm installed systems, ownership, access, and licenses before selecting providers. Provider links below are references, not claims about the customer's stack.

## Integration options

| Area and priority | Recommended approach | Fastest practical start | Failure and fallback |
|---|---|---|---|
| **ERP, accounting, purchasing, inventory, migration** — Essential for rollout; absent here | Keep the installed ERP authoritative; use a versioned REST adapter such as [Business Central API v2.0](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/api-reference/v2.0/). | Map source IDs and owners; start with validated CSV read/export. | Show source and sync age; retry transient errors, queue conflicts, and never overwrite posted records. |
| **Customers, CRM, orders, portals, forecasts** — Essential for rollout; absent here | Read demand from its system of record through REST or customer-supported [GS1 EDI](https://support.gs1.org/support/solutions/articles/43000734296-what-is-gs1-edi-). | Import open orders by stable source ID with a preview. | Hold unknown or changed orders for review; make retries idempotent and retain the last good snapshot. |
| **Suppliers, subcontractors, POs, updates, invoices, portals** — Essential for rollout; simulated locally | Use the ERP supplier master and supported API/EDI/portal; [Odoo External API](https://www.odoo.com/documentation/18.0/developer/reference/external_api.html) is one reference. | Use a validated CSV with stable vendor and update IDs. | Detect duplicates; retain failed rows and reasons for correction/retry; allow reviewed manual entry. |
| **Product engineering, BOMs, drawings, revisions** — Essential for rollout; absent here | Read released revisions from ERP/PLM and retain revision IDs; see [Odoo PLM version control](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/plm/manage_changes/version_control.html). | Import released product and operation data read-only. | Quarantine missing or superseded revisions; block dispatch until corrected. |
| **Production, MES, scheduling, shop-floor reporting** — Essential for rollout; absent here | Agree which system owns work-order status; consume its API/events. [Odoo Manufacturing](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/manufacturing.html) is a process reference. | Start with a read-only open-order feed. | Label source/freshness; retain the last good snapshot and queue conflicts. |
| **Machines, IoT, downtime, maintenance** — Optional; not applicable to this exception demo | Add an MES gateway or [OPC UA](https://reference.opcfoundation.org/specs/OPC-10000-1/4) only for a confirmed machine-state need. | Keep milestones manual until devices and access are approved. | Buffer events, mark stale data, and never infer completion from missing telemetry. |
| **Warehouse, logistics, barcode/RFID, scales, WMS, transport** — Essential for rollout; simulated locally | Integrate the authoritative ERP/WMS; consider [GS1 EPCIS](https://www.gs1.org/standards/epcis) for shared trace events. | Exchange receipt files keyed to the production order and physical reference. | Flag duplicates, unknown lots, and partial/over-receipts; never add accepted stock before inspection. |
| **Quality, labs, certificates, traceability** — Essential for rollout; basic checks local | Link inspection plans and nonconformance disposition to the QMS; see [Odoo quality checks](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/quality/quality_management/quality_checks.html). | Capture accepted/rejected counts, reason, hold, and receipt; export exceptions if there is no API. | Keep rejected stock unavailable; block shipment until disposition or reinspection is recorded. |
| **Finance, banking, AP, payments, invoice reconciliation** — Essential for rollout; quantity-only here | Keep posting/payment in ERP/AP; match quantity and value against PO, service entry, receipt, acceptance, tax, and tolerances. [Business Central API](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/api-reference/v2.0/) is one reference. | Export discrepancies for AP review; do not post or pay from this prototype. | Never auto-approve mismatches; retain evidence, stop posting when required data is missing, and support reversal. |
| **GST, e-invoicing, e-way bills** — Essential when legally applicable; not applicable to this prototype | Confirm applicability with the tax owner and follow the customer's ERP/GSP and [GST e-invoice portal](https://einvoice.gst.gov.in/) guidance. | Document the approved provider, sandbox, credentials, and sign-off path; generate no statutory documents here. | Fail closed when a required document cannot be issued; retain provider responses and retry safely. |
| **People, HR, identity, access, SSO** — Essential before multi-user rollout; absent here | Use tenant identity with OIDC/SSO; [Microsoft Entra OIDC](https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc) is one option. | Pilot one local operator; add sign-in and a role matrix before shared data. | Deny by default, scope access by plant/vendor, log actor and reason, and centrally revoke access. |
| **Communication (email/WhatsApp/SMS), documents, OCR, signatures** — Optional; references only here | Keep files in ERP/QMS storage; use an approved messaging provider such as [Microsoft Graph mail](https://learn.microsoft.com/en-us/graph/api/resources/mail-api-overview?view=graph-rest-1.0) for a defined workflow. | Store document references; add outbound notifications only after the exception queue. | Track delivery, prevent duplicate sends, retain source links, and provide manual follow-up. |
| **Reporting, BI, warehouse, exports** — Essential for operations; basic dashboard local | Publish validated workflow facts to the customer's BI platform, such as [Power BI REST APIs](https://learn.microsoft.com/en-us/rest/api/power-bi/). | Reconcile dashboard totals, then export validated CSV before building a connector. | Show source/freshness; distinguish missing from zero and reconcile totals to ERP. |

## Build into ForgeFlow

Keep the quantity ledger and business rules in ForgeFlow: dispatch, receipt, inspection, shipment, stock availability, variance calculations, exception ownership, idempotency, and audit events. Integrate authoritative systems for master data, accounting, identity, statutory documents, and specialist capabilities; a connector may transport events but must not own quantity rules.

## Technical approach

- Keep domain actions separate from API, EDI, and file transport.
- Give each external message a source, stable ID, timestamp, schema version, and processing state. Enforce idempotency in the database.
- Validate references and quantity invariants before posting; protect retained payloads and define access/retention rules.
- Add a transactional inbox/outbox for safe retries, plus a review queue for business conflicts.
- Monitor sync lag, failures, retry age, and dead-letter items; assign an owner to each exception.
- Select no paid connector or iPaaS until licenses, volume, security, and support are confirmed.

## Delivery sequence

### First two days

1. Map the process and quantity ownership with production, warehouse, quality, procurement, and AP.
2. Confirm source systems, IDs, reference formats, data classification, volume, and plant/offline needs.
3. Agree event schemas and invariants; validate against the assignment's 1,000 / 800 / 780 / 740 / 40 / 800 case.
4. Request approved sandbox access, API/EDI specs, service accounts, and sample payloads.

### First week

1. Build authenticated server persistence and audit history; move tested prototype rules into domain services.
2. Deliver one read-only ERP order feed and one vendor update path, using CSV if APIs are unavailable.
3. Add idempotency, retry/review queues, reconciliation exports, and basic monitoring.
4. Validate partial receipt, rejection, duplicate update, outage, and invoice mismatch with operations and finance.

### First month

1. Pilot one plant, one subcontract operation, and a small consenting supplier group.
2. Add WMS/QMS/AP connections only after the pilot confirms ownership and exception handling.
3. Complete security, retention, recovery, monitoring, support, and operator training.
4. Expand by plant/vendor using measured reconciliation accuracy, retry age, and delivery-risk results; retain rollback.

## Team, tools, and dependencies

Assume one product/process owner, one manufacturing/quality SME, two engineers, and shared ERP/security/finance support. Start read-only until system owners approve credentials and write scopes.

Keep **Next.js, React, and TypeScript** for the prototype. For shared rollout, add an authenticated API and transactional PostgreSQL database with migrations and constraints. Reuse the customer's ERP, identity, supplier EDI/API, and licensed managed services. Start with validated file exchange; add REST, webhooks, or EDI adapters after confirming interfaces. Build the domain ledger, idempotency, audit, and exception handling in ForgeFlow. No provider or live connector is selected here.

Dependencies: system-owner approval; API/EDI specs and test data; identity and network setup; finance/tax decisions; security and retention review; and supplier/customer onboarding.

## Research references

- [SAP S/4HANA subcontracting process](https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/fe39e10a9a864a8f8dc9537704f0fa13/4f13b953495bb44ce10000000a174cb4) and [Odoo subcontracting](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/manufacturing/subcontracting.html) informed keeping subcontracted material movements explicit against the production order.
- [Odoo quality checks](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/quality/quality_management/quality_checks.html) informed keeping physical receipt separate from inspection and accepted stock.
- Other official references appear in the integration table; providers are examples, not assumed customer systems.
