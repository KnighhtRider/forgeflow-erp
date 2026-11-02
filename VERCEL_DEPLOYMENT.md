# Vercel deployment

This guide deploys the current ForgeFlow **review demo**. It does not turn the browser-only prototype into a shared production ERP.

## Before pushing

Use Node.js 24.x and pnpm 12.15.0. From the repository root, run:

```sh
pnpm install --frozen-lockfile
pnpm verify
```

Commit the source, `pnpm-lock.yaml`, and documentation to GitHub. Do not commit `.env` files, credentials, `node_modules`, `.next`, or `.vercel`. The current app needs no deployment environment variables.

## Import into Vercel

1. In Vercel, choose **Add New → Project** and import the GitHub repository.
2. Set the project root to the repository root. Keep the detected **Next.js** framework preset and default output settings.
3. Set the project Node.js version to **24.x** if it is not selected automatically. `package.json` pins the supported Node major and pnpm version.
4. Leave environment variables empty for this demo. Deploy the project.
5. Open the deployment and check Dashboard, Orders, Warehouse receipts, Quality, Reconciliation, and History. Create a demo order and confirm a refresh does not break the page.

Vercel detects Next.js and the package manager from the repository files; the `pnpm-lock.yaml` selects pnpm. See [Vercel's Next.js deployment guide](https://vercel.com/docs/frameworks/nextjs) and [Node.js version settings](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

## Optional private review deployment

If only reviewers should open the demo, configure Vercel **Deployment Protection** for the appropriate production and preview URLs in project settings. Vercel Authentication is available for team users; production-domain protection options depend on the Vercel plan. Check the current [Deployment Protection documentation](https://vercel.com/docs/deployment-protection) before choosing a scope. Do not treat an obscure URL as access control.

## Data and production boundary

- All operational records are kept in each visitor's browser `localStorage`; there is no server database, login, or user/role authorization. Different browsers and devices do not share data. Clearing browser storage can remove records.
- Treat the hosted app as a public demonstration unless Vercel Deployment Protection is enabled. Even with deployment protection, do not enter real business, customer, supplier, employee, or financial data: the app has no application-level authorization or server-side data isolation.
- A Vercel deployment does not provide a database, durable backups, shared audit trail, concurrency control, or real ERP/vendor connections. Those require a separate backend and identity design before operational use.
- The app sends no data to an external analytics or error-reporting service. Deployment/build output is available in Vercel's project logs; browser-side workflow errors are shown in the UI.

For a real shared production system, first select and provision the database and identity provider, then replace `ForgeProvider` local storage with authenticated server-side persistence, tenant/user authorization, database constraints and migrations, durable audit events, backup/restore procedures, and integration monitoring. The current assignment workflow and its limits are documented in [README.md](./README.md), and [INTEGRATION_PLAN.md](./INTEGRATION_PLAN.md).
