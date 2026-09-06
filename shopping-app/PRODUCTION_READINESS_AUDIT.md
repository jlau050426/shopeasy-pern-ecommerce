# Production Readiness Audit

**Audit date:** 2026-09-05  
**Scope:** React frontend, Express backend, PostgreSQL access, sessions, Stripe checkout, WebSockets, uploads, and automated checks.

## Summary

The project is **not production-ready**. The CSRF implementation has improved: application mutation routes now use route-level CSRF middleware and the frontend/server header name is aligned. However, critical payment fulfilment, session persistence, data integrity, validation, and deployment issues remain.

## Verification Results

| Check | Result |
| --- | --- |
| Frontend lint | Passed |
| Frontend production build | Passed |
| Frontend tests | Failed: 1 of 4 tests fails |
| Backend JavaScript syntax checks | Passed |
| Backend tests | Not configured; `npm test` intentionally fails |
| Git diff whitespace check | Passed |

## Critical Errors and Bugs

### 1. Paid orders are created from the current cart, not the paid cart

`server/services/orderService.js` reads the user's live cart after Stripe sends the webhook. A customer can begin checkout, alter their cart in another tab, and then pay. The stored order may not match the items charged by Stripe.

**Fix:** Create a pending order and immutable item snapshot before creating the Stripe Checkout Session. Put the pending order ID in Stripe metadata. The webhook must fulfil that stored snapshot, not query the cart.

### 2. Shipping and tax are charged but not stored with the order

`server/controllers/shop.js` now adds shipping and tax to Stripe line items. `server/services/orderService.js` only stores product unit prices and quantities. Order history and invoices therefore omit shipping and tax even though the customer paid them.

**Fix:** Persist currency, item subtotal, shipping, tax, final total, and product/order-item snapshots in the order tables.

### 3. Stripe webhook does not confirm payment status

The `checkout.session.completed` handler fulfils an order without first requiring `session.payment_status === "paid"`.

**Fix:** Verify the payment state before fulfilment, and handle delayed or failed payment events according to Stripe's documented event flow.

### 4. Stripe webhook idempotency has a concurrency race

The code checks whether `stripe_session_id` exists, then inserts an order. Concurrent webhook deliveries can both pass the check and create duplicate orders.

**Fix:** Add a database unique constraint on `orders.stripe_session_id` and record Stripe event IDs in a table with a unique primary key. Treat a unique-constraint conflict as already processed.

### 5. Checkout redirects are hard-coded to localhost

Stripe success and cancellation URLs use `http://localhost:5173`. This cannot work in production.

**Fix:** Use a validated `FRONTEND_URL` environment variable, for example `https://shop.example.com`.

### 6. Historical orders depend on current products

Order queries use `INNER JOIN products`. If a product is deleted or changed, historical orders/invoices can disappear or display changed data.

**Fix:** Store immutable product title, image URL, unit price, SKU, and other required display details in `order_items`; do not rely on the current product row for historical orders.

### 7. Customers can permanently delete paid orders

`DELETE /orders/:orderId` removes paid order data.

**Fix:** Replace deletion with a controlled status transition such as `RECEIVED`, `CANCEL_REQUESTED`, or `REFUNDED`. Retain orders for financial records, customer support, and audit requirements.

### 8. Order deletion is non-transactional

Order items and the parent order are deleted through separate queries. A failure between them leaves partial data.

**Fix:** Use one database transaction for any multi-step order state change.

## CSRF and Session Issues

### 9. CSRF token is stale after logout

The React API client caches the token. Logout destroys the server session, but the cached token remains. The next unsafe request can be rejected with HTTP 403.

**Fix:** Reset the client-side token after successful logout and fetch a fresh token before the next unsafe request.

### 10. First unsafe request can race token initialization

`initializeCsrf()` runs asynchronously when `App` mounts. A fast Login or Signup submission can happen before the token is available, resulting in HTTP 403.

**Fix:** Make the Axios request interceptor await token initialization for `POST`, `PUT`, `PATCH`, and `DELETE` requests.

### 11. The default Express memory session store is used

The default `express-session` store loses sessions on restart, is not shared by multiple server instances, and is not suitable for production.

**Fix:** Use a PostgreSQL or Redis session store.

### 12. Production session-cookie settings are incomplete

The session cookie does not use `secure: true` in production and the app does not configure proxy trust for reverse-proxy deployments.

**Fix:** Set `secure: process.env.NODE_ENV === "production"`; configure `app.set("trust proxy", 1)` when deployed behind a trusted HTTPS proxy.

### 13. Successful login does not regenerate the session

Login reuses the anonymous session ID, exposing the application to session fixation.

**Fix:** Call `req.session.regenerate()` after password verification, then set the authenticated session fields and generate a new CSRF token.

## Security and Validation Issues

### 14. Public signup can grant administrator access

The admin passkey is now environment-based, which is better than a hard-coded value. However, anyone who obtains the shared passkey can self-register as an administrator.

**Fix:** Do not grant administrator status through public registration. Use protected operational provisioning or hashed, single-use, expiring invitation tokens.

### 15. Authentication and password-reset endpoints have no rate limits

Login, signup, reset, and checkout requests can be repeatedly submitted.

**Fix:** Add rate limiting and abuse monitoring, particularly to login and password reset endpoints.

### 16. Password requirements are weak

Passwords may be only six alphanumeric characters.

**Fix:** Require a minimum length of at least 12 characters, permit symbols/passphrases, and impose a bcrypt-safe maximum length.

### 17. Important request data lacks server-side validation

Cart quantities, product/cart/order IDs, and delivery option IDs are passed to database queries without route-boundary validation.

**Fix:** Validate IDs as positive integers (or UUIDs if applicable), validate quantities as bounded positive integers, and validate delivery option ownership/existence. Enforce essential rules with database constraints too.

### 18. Product prices can be negative

The admin route uses `.isFloat()` but does not enforce a minimum value.

**Fix:** Require a positive price, for example `.isFloat({ min: 0.01 })`, and enforce a database check constraint.

### 19. Image upload validation trusts the client MIME type

Multer accepts files based on their declared MIME type and saves them under names derived from the original filename. Uploaded files are publicly served.

**Fix:** Inspect file bytes, re-encode accepted files with an image library, generate filenames server-side, limit dimensions/pixels, and preferably store uploads in private object storage.

### 20. Product image/database updates can leave broken image references

Editing a product deletes the old image before updating the database. If the database update fails, the product may reference a missing image.

**Fix:** Save the new image, update the database, then remove the old file after database success. Queue failed cleanup for retry.

### 21. CORS and Socket.IO are localhost-only

Express and Socket.IO only allow `http://localhost:5173`.

**Fix:** Read allowed origins from configuration and validate them on startup.

## Error Handling and Data-Retention Issues

### 22. The global error handler discards intended status codes

The global Express handler always sends HTTP 500, including for application errors intentionally marked as 400 or 404.

**Fix:** Respond with `err.statusCode || 500`; return generic text for 5xx errors and safe client messages for expected 4xx errors.

### 23. Central error logging is absent

The global handler returns a generic error but no longer logs error details centrally.

**Fix:** Add structured server-side logging and production error monitoring. Do not expose stack traces or database errors to clients.

### 24. Invoice generation writes predictable shared files

Invoices are written to `data/invoice-{orderID}.pdf`. Simultaneous requests for the same order can conflict, and customer files remain on disk.

**Fix:** Stream PDF output directly to the response or use unique temporary files/private object storage with cleanup.

### 25. Runtime files are committed to Git

The repository tracks generated invoices and server-side uploaded images.

**Fix:** Remove generated runtime data from version control and add the appropriate directories to `.gitignore`; use managed storage in production.

### 26. Database schema and migrations are missing

The repository contains no migrations defining required tables, constraints, indexes, defaults, or seed data.

**Fix:** Add versioned database migrations and document fresh-environment setup.

## Frontend Bugs

### 27. Edit Product incorrectly requires a replacement image

The backend supports keeping the existing image, but `frontend/src/pages/admin/editProductForm.jsx` blocks any edit when `imageFile` is absent.

**Fix:** Make image replacement optional for edits; append the image to `FormData` only when one is selected.

### 28. `setTimeout(5)` is invalid error-handling code

`frontend/src/pages/admin/editProductForm.jsx` calls `setTimeout(5)`. It appears to be intended as `setCountdown(5)`.

**Fix:** Replace it with `setCountdown(5)` and ensure pending timeouts are cleared when the component unmounts.

### 29. Currency labels conflict

Admin pages use USD and `$`, while the backend charges MYR and the customer interface displays RM.

**Fix:** Choose one currency and apply it consistently across pricing data, display formatting, Stripe configuration, invoices, and admin forms.

### 30. Product Details can display the wrong currency

When PostgreSQL returns numeric values as strings, the product detail fallback renders `$${product.price}` instead of RM formatting.

**Fix:** Normalize prices at the API boundary or always format numeric strings through the same RM money formatter.

### 31. Code after Stripe navigation is unreliable

`PaymentSummary.jsx` changes `window.location.href` and then attempts to fetch the cart and navigate within the SPA. Browser navigation makes the later code unreliable.

**Fix:** Redirect to Stripe and return immediately. Let the Stripe success URL load the order page.

### 32. Frontend test suite has a failing assertion

`ProductContainer.test.jsx` expects a relative image path, but the component generates an absolute URL using `VITE_API_URL`.

**Fix:** Update the expected source or mock `VITE_API_URL` consistently.

### 33. Backend test suite does not exist

The server `test` script intentionally fails and no API, authorization, CSRF, payment, webhook, upload, or database tests exist.

**Fix:** Add unit and integration tests, especially for payment snapshots, webhook replays, cross-user authorization, and CSRF failures.

### 34. Router package versions conflict

The frontend includes `react-router@8.2.0` while `react-router-dom@7.18.1` installs `react-router@7.18.1`. Both versions are present.

**Fix:** Align the versions, or remove the direct `react-router` dependency if imports are solely from `react-router-dom`.

## Recommended Remediation Order

1. Implement immutable pending orders, webhook payment verification, and database-enforced webhook idempotency.
2. Persist complete paid-order totals and product snapshots; remove destructive order deletion.
3. Move sessions to Redis/PostgreSQL, secure cookies, and regenerate the session on login.
4. Complete the CSRF token lifecycle: await initialization, reset after logout, and refresh after session regeneration.
5. Add request validation, rate limiting, secure upload processing, and safer admin provisioning.
6. Replace localhost configuration with environment-based deployment configuration.
7. Add migrations, backend tests, monitoring/logging, and health/readiness checks.
8. Fix the frontend edit-image, currency, redirect, test, and router-version issues.
