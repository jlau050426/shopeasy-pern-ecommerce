# Project Audit & Bug Report: React + Node.js REST E-Commerce System

## Executive Summary
A comprehensive static analysis and test execution audit was conducted across the entire codebase (`React/ecommerce-project` and `Nodejs/00-starting-setup`). Multiple critical runtime bugs, broken API contracts, database query syntax errors, unit test failures, currency/unit math mismatches, and architectural issues were identified.

This document contains the detailed breakdown of all defects accompanied by concrete, copy-paste-ready solutions for each issue.

---

## Table of Contents
1. [Backend Critical Bugs & Solutions (`Nodejs/00-starting-setup`)](#1-backend-critical-bugs--solutions)
   - [1.1 SQL Syntax Error in `fetchOrdersByID`](#11-sql-syntax-error-in-fetchordersbyid)
   - [1.2 Undefined Method Call & Incorrect Parameters in `shopController.getOrder`](#12-undefined-method-call--incorrect-parameters-in-shopcontrollergetorder)
   - [1.3 Stripe Webhook Database Rollback due to `NaN` Timestamp](#13-stripe-webhook-database-rollback-due-to-nan-timestamp)
   - [1.4 Unclosed HTTP Connection in Password Reset](#14-unclosed-http-connection-in-password-reset)
   - [1.5 Fatal Argument Mismatch in `adminController.getProducts`](#15-fatal-argument-mismatch-in-admincontrollergetproducts)
   - [1.6 Missing EJS View Templates in Admin Controller](#16-missing-ejs-view-templates-in-admin-controller)
   - [1.7 REST Authentication Flaw: 302 HTML Redirect Instead of 401 JSON](#17-rest-authentication-flaw-302-html-redirect-instead-of-401-json)
   - [1.8 Stripe Success & Cancel URLs Point to Backend API Endpoints](#18-stripe-success--cancel-urls-point-to-backend-api-endpoints)
   - [1.9 Reset Password Link Uses Backend Port](#19-reset-password-link-uses-backend-port)
   - [1.10 Missing Global CORS Middleware](#110-missing-global-cors-middleware)
2. [Frontend Critical Bugs & Solutions (`React/ecommerce-project`)](#2-frontend-critical-bugs--solutions)
   - [2.1 Currency & Pricing Math Unit Mismatch (Dollars vs Cents)](#21-currency--pricing-math-unit-mismatch-dollars-vs-cents)
   - [2.2 Complete Unit Test Suite Failure (4 of 4 Tests Failing)](#22-complete-unit-test-suite-failure-4-of-4-tests-failing)
   - [2.3 Order Tracking Data Contract Mismatch](#23-order-tracking-data-contract-mismatch)
   - [2.4 Broken Navigation Link in Order Tracking](#24-broken-navigation-link-in-order-tracking)
   - [2.5 Orders Page Delivery Date Displays "Invalid Date"](#25-orders-page-delivery-date-displays-invalid-date)
   - [2.6 JSX Attribute Warnings: `class` Used Instead of `className`](#26-jsx-attribute-warnings-class-used-instead-of-classname)
   - [2.7 Unsafe Property Access on Auth Failure](#27-unsafe-property-access-on-auth-failure)
   - [2.8 ESLint Hook Rule Violation in `OrderTracking.jsx`](#28-eslint-hook-rule-violation-in-ordertrackingjsx)
3. [Architecture & Security Observations](#3-architecture--security-observations)

---

## 1. Backend Critical Bugs & Solutions

### 1.1 SQL Syntax Error in `fetchOrdersByID`
- **Location:** [`Nodejs/00-starting-setup/model/orders.js:59-84`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/Nodejs/00-starting-setup/model/orders.js#L59-L84)
- **Issue:** Missing comma after `order_items.date_receive_ms` on line 70:
  ```sql
  order_items.date_receive_ms
  products.title,
  products.imageurl
  ```
- **Impact:** PostgreSQL throws a syntax error when single orders or invoices are fetched.

#### Solution
In [`Nodejs/00-starting-setup/model/orders.js`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/Nodejs/00-starting-setup/model/orders.js#L59-L84), add the missing comma after `order_items.date_receive_ms`:
```javascript
static fetchOrdersByID(sessionUserID, orderID) {
  return db.query(
    `SELECT
      orders.id AS order_id,
      orders.status,
      orders.created_at,
      order_items.product_id,
      order_items.quantity,
      order_items.price,
      (order_items.quantity * order_items.price) AS total_price,
      order_items.date_receive_ms,
      products.title,
      products.imageurl
    FROM order_items
    INNER JOIN orders ON order_items.order_id = orders.id
    INNER JOIN products ON order_items.product_id = products.id
    WHERE orders.user_id = $1 
      AND orders.id = $2`,
    [sessionUserID, orderID],
  );
}
```

---

### 1.2 Undefined Method Call & Incorrect Parameters in `shopController.getOrder`
- **Location:** [`Nodejs/00-starting-setup/controllers/shop.js:190-203`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/Nodejs/00-starting-setup/controllers/shop.js#L190-L203)
- **Issue:**
  ```javascript
  const result = await Product.fetchOrdersByID(id);
  ```
  1. Method exists on `Orders`, not `Product`.
  2. `Orders.fetchOrdersByID(sessionUserID, orderID)` requires two arguments.
- **Impact:** `GET /checkout/orders/:orderID` crashes with `TypeError: Product.fetchOrdersByID is not a function`.

#### Solution
Update `getOrder` in [`Nodejs/00-starting-setup/controllers/shop.js`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/Nodejs/00-starting-setup/controllers/shop.js#L190-L203):
```javascript
const getOrder = async (req, res, next) => {
  const orderID = req.params.orderID;
  const sessionUserID = req.session.sessionUserID;

  try {
    const result = await Orders.fetchOrdersByID(sessionUserID, orderID);
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ message: "Order Not Found!" });
    }
    res.status(200).json({
      order: result.rows[0],
      items: result.rows,
    });
  } catch (err) {
    next(err);
  }
};
```

---

### 1.3 Stripe Webhook Database Rollback due to `NaN` Timestamp
- **Location:** [`Nodejs/00-starting-setup/controllers/shop.js:314-315`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/Nodejs/00-starting-setup/controllers/shop.js#L314-L315) and [`Nodejs/00-starting-setup/model/cart.js:17-39`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/Nodejs/00-starting-setup/model/cart.js#L17-L39)
- **Issue:** `Cart.fetchAllCart` omits `delivery_options.delivery_days`. Thus, `item.delivery_days` is `undefined`, `dateReceiveMs` evaluates to `NaN`, and database insertion fails, rolling back the transaction.

#### Solution
1. In [`Nodejs/00-starting-setup/model/cart.js`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/Nodejs/00-starting-setup/model/cart.js#L17-L39), select `delivery_options.delivery_days`:
```javascript
static async fetchAllCart(sessionUserID) {
  return db.query(
    `SELECT
      cart.id,
      cart.quantity,
      cart.product_id,
      cart.delivery_options,
      products.title,
      products.price,
      products.description,
      products.imageurl,
      (cart.quantity * products.price) AS item_total,
      delivery_options.price_cents,
      delivery_options.delivery_days
    FROM cart
    INNER JOIN products ON cart.product_id = products.id
    INNER JOIN delivery_options ON cart.delivery_options = delivery_options.id
    WHERE cart.user_id = $1`,
    [sessionUserID],
  );
}
```

2. In [`Nodejs/00-starting-setup/controllers/shop.js:314-315`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/Nodejs/00-starting-setup/controllers/shop.js#L314-L315), add a safe numeric fallback:
```javascript
const deliveryDays = Number(item.delivery_days) || 3;
const dateReceiveMs = currentTime + deliveryDays * 24 * 60 * 60 * 1000;
```

---

### 1.4 Unclosed HTTP Connection in Password Reset
- **Location:** [`Nodejs/00-starting-setup/controllers/auth.js:251`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/Nodejs/00-starting-setup/controllers/auth.js#L251)
- **Issue:** Handler executes `return res.status(201)` without sending a response body. The client hangs indefinitely.

#### Solution
In [`Nodejs/00-starting-setup/controllers/auth.js:251`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/Nodejs/00-starting-setup/controllers/auth.js#L251), return a JSON response:
```javascript
await db.query(
  `UPDATE users
   SET password = $1,
       reset_token_hash = NULL,
       reset_token_expiry = NULL
   WHERE id = $2`,
  [hashedPassword, userID],
);

return res.status(200).json({
  message: "Password reset successfully! You can now log in.",
});
```

---

### 1.5 Fatal Argument Mismatch in `adminController.getProducts`
- **Location:** [`Nodejs/00-starting-setup/controllers/admin.js:153-170`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/Nodejs/00-starting-setup/controllers/admin.js#L153-L170)
- **Issue:** Signature expects 4 parameters `(req, next, productsPerPage, callback)`. 5 parameters are passed, causing `TypeError: callback is not a function`.

#### Solution
In [`Nodejs/00-starting-setup/controllers/admin.js`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/Nodejs/00-starting-setup/controllers/admin.js#L153-L170):
```javascript
const getProducts = async (req, res, next) => {
  const productsPerPage = 3;
  await pagination(
    req,
    next,
    productsPerPage,
    async (fetchPage, totalPages) => {
      res.render("../views/admin/admin-product-list.ejs", {
        prods: fetchPage.rows,
        pageTitle: "Admin Product",
        path: "/admin/products",
        totalPages: totalPages,
        errorMessage: req.flash("error"),
      });
    },
  );
};
```

---

### 1.6 Missing EJS View Templates in Admin Controller
- **Location:** [`Nodejs/00-starting-setup/controllers/admin.js`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/Nodejs/00-starting-setup/controllers/admin.js)
- **Issue:** Admin endpoints call `res.render(...)` targeting non-existent EJS templates.

#### Solution
Convert admin endpoints into JSON REST API endpoints returning structured JSON data:
```javascript
const getProducts = async (req, res, next) => {
  const productsPerPage = 10;
  await pagination(
    req,
    next,
    productsPerPage,
    async (fetchPage, totalPages) => {
      res.status(200).json({
        products: fetchPage.rows,
        totalPages: totalPages,
      });
    },
  );
};
```

---

### 1.7 REST Authentication Flaw: 302 HTML Redirect Instead of 401 JSON
- **Location:** [`Nodejs/00-starting-setup/middleware/is-auth.js:1-8`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/Nodejs/00-starting-setup/middleware/is-auth.js#L1-L8)
- **Issue:** SPA requests follow 302 redirects to `/login` instead of receiving a 401 Unauthorized status.

#### Solution
In [`Nodejs/00-starting-setup/middleware/is-auth.js`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/Nodejs/00-starting-setup/middleware/is-auth.js#L1-L8):
```javascript
const isAuth = (req, res, next) => {
  if (!req.session || !req.session.isLoggedIn) {
    return res.status(401).json({
      message: "Unauthorized. Please log in to continue.",
    });
  }
  next();
};

module.exports = isAuth;
```

---

### 1.8 Stripe Success & Cancel URLs Point to Backend API Endpoints
- **Location:** [`Nodejs/00-starting-setup/controllers/shop.js:243-245`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/Nodejs/00-starting-setup/controllers/shop.js#L243-L245)
- **Issue:** Stripe redirects customers to raw backend JSON or 404 routes rather than the React client frontend.

#### Solution
In [`Nodejs/00-starting-setup/controllers/shop.js:243-245`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/Nodejs/00-starting-setup/controllers/shop.js#L243-L245):
```javascript
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

const session = await stripe.checkout.sessions.create({
  mode: "payment",
  payment_method_types: ["card"],
  line_items: cart.map((c) => ({
    price_data: {
      currency: "myr",
      product_data: {
        name: c.title,
      },
      unit_amount: Math.round(Number(c.price) * 100),
    },
    quantity: c.quantity,
  })),
  metadata: {
    user_id: sessionUserID.toString(),
  },
  success_url: `${clientUrl}/checkout/orders?success=true`,
  cancel_url: `${clientUrl}/checkout?canceled=true`,
});
```

---

### 1.9 Reset Password Link Uses Backend Port
- **Location:** [`Nodejs/00-starting-setup/controllers/auth.js:188`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/Nodejs/00-starting-setup/controllers/auth.js#L188)
- **Issue:** Email link targets the backend port where the route does not exist.

#### Solution
In [`Nodejs/00-starting-setup/controllers/auth.js:188`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/Nodejs/00-starting-setup/controllers/auth.js#L188):
```javascript
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

await transport.sendMail({
  from: process.env.EMAIL_FROM || "joshua250426.work@gmail.com",
  to: email,
  subject: "Reset Password Request",
  html: `
    <p>You requested a password reset</p>
    <p>Click this <a href="${clientUrl}/set-new-password/${token}">link</a> to reset your password</p>
  `,
});
```

---

### 1.10 Missing Global CORS Middleware
- **Location:** [`Nodejs/00-starting-setup/app.js`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/Nodejs/00-starting-setup/app.js)
- **Issue:** No CORS headers are configured with credentials support for cross-origin SPA requests.

#### Solution
1. Install `cors`:
   ```bash
   npm install cors
   ```
2. In [`Nodejs/00-starting-setup/app.js`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/Nodejs/00-starting-setup/app.js), configure `cors`:
```javascript
const cors = require("cors");

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "csrf-token"],
  }),
);
```

---

## 2. Frontend Critical Bugs & Solutions

### 2.1 Currency & Pricing Math Unit Mismatch (Dollars vs Cents)
- **Location:**
  - [`React/ecommerce-project/src/utils/money.js`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/React/ecommerce-project/src/utils/money.js)
  - [`React/ecommerce-project/src/pages/checkout/PaymentSummary.jsx:24-30`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/React/ecommerce-project/src/pages/checkout/PaymentSummary.jsx#L24-L30)
- **Issue:**
  1. `formatMoney` does not divide cents by 100, causing test failures.
  2. `shippingCostTotal` is in cents (e.g. `499`) while `grandTotal` is in dollars (e.g. `10.90`). Adding them directly yields `$509.90` instead of `$15.89`.

#### Solution
1. Update [`src/utils/money.js`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/React/ecommerce-project/src/utils/money.js):
```javascript
/**
 * Formats a monetary amount. If the amount is in cents, pass isCents = true.
 * Defaults to formatting cents if greater than standard threshold or provide dedicated functions.
 */
export function formatMoney(amountInCents) {
  return `$${(Math.round(Number(amountInCents)) / 100).toFixed(2)}`;
}

export function formatDollars(amountInDollars) {
  return `$${Number(amountInDollars).toFixed(2)}`;
}
```

2. Update [`src/pages/checkout/PaymentSummary.jsx`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/React/ecommerce-project/src/pages/checkout/PaymentSummary.jsx#L24-L30):
```javascript
const grandTotal = Number(paymentSummary.grandTotal) || 0; // In Dollars
const shippingCostTotalDollars = (Number(paymentSummary.shippingCostTotal) || 0) / 100; // Cents to Dollars
const totalCostBeforeTax = grandTotal + shippingCostTotalDollars;
const tax = totalCostBeforeTax * 0.10;
const orderTotal = totalCostBeforeTax + tax;

return (
  <div className="payment-summary">
    <div className="payment-summary-title">Payment Summary</div>
    <div className="payment-summary-row">
      <div>Items ({totalItems}):</div>
      <div className="payment-summary-money">${grandTotal.toFixed(2)}</div>
    </div>
    <div className="payment-summary-row">
      <div>Shipping &amp; handling:</div>
      <div className="payment-summary-money">${shippingCostTotalDollars.toFixed(2)}</div>
    </div>
    <div className="payment-summary-row subtotal-row">
      <div>Total before tax:</div>
      <div className="payment-summary-money">${totalCostBeforeTax.toFixed(2)}</div>
    </div>
    <div className="payment-summary-row">
      <div>Estimated tax (10%):</div>
      <div className="payment-summary-money">${tax.toFixed(2)}</div>
    </div>
    <div className="payment-summary-row total-row">
      <div>Order total:</div>
      <div className="payment-summary-money">${orderTotal.toFixed(2)}</div>
    </div>
    <button className="place-order-button button-primary" onClick={CreateOrder}>
      Place your order
    </button>
  </div>
);
```

---

### 2.2 Complete Unit Test Suite Failure (4 of 4 Tests Failing)
- **Location:**
  - [`src/pages/home/ProductContainer.jsx`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/React/ecommerce-project/src/pages/home/ProductContainer.jsx)
  - [`src/pages/home/ProductContainer.test.jsx`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/React/ecommerce-project/src/pages/home/ProductContainer.test.jsx)

#### Solution
1. In [`src/pages/home/ProductContainer.jsx`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/React/ecommerce-project/src/pages/home/ProductContainer.jsx#L83-L97), give distinct `data-testid` values:
```jsx
<button
  className="add-to-cart-button button-primary"
  onClick={() => CartDetail(product.id)}
  data-testid="product-details-button"
>
  Product Details
</button>

<button
  className="add-to-cart-button button-primary"
  onClick={AddToCart}
  data-testid="add-to-cart-button"
>
  Add to Cart
</button>
```

2. In [`src/pages/home/ProductContainer.test.jsx`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/React/ecommerce-project/src/pages/home/ProductContainer.test.jsx), wrap in `<MemoryRouter>`, fix mock product schema, and correct assertion parentheses:
```jsx
import { it, expect, describe, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProductContainer } from "./ProductContainer";
import userEvent from "@testing-library/user-event";
import axios from "axios";

vi.mock("axios");

describe("Product detailed component", () => {
  let product;
  let fetchCart;

  beforeEach(() => {
    product = {
      id: "e43638ce-6aa0-4b85-b27f-e1d07eb678c6",
      imageurl: "/images/products/athletic-cotton-socks-6-pairs.jpg",
      title: "Black and Gray Athletic Cotton Socks - 6 Pairs",
      rating_star: 4.5,
      rating_count: 87,
      price: 10.90,
    };

    fetchCart = vi.fn();
    vi.clearAllMocks();
  });

  it("display the component detail correctly", () => {
    render(
      <MemoryRouter>
        <ProductContainer product={product} fetchCart={fetchCart} />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Black and Gray Athletic Cotton Socks - 6 Pairs"),
    ).toBeInTheDocument();
    expect(screen.getByText("$10.90")).toBeInTheDocument();
    expect(screen.getByTestId("product-image")).toHaveAttribute(
      "src",
      "/images/products/athletic-cotton-socks-6-pairs.jpg",
    );
    expect(screen.getByText("87")).toBeInTheDocument();
  });

  it("adds a product to the cart", async () => {
    axios.post.mockResolvedValueOnce({ data: { message: "Success" } });

    render(
      <MemoryRouter>
        <ProductContainer product={product} fetchCart={fetchCart} />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    const addToCartButton = screen.getByTestId("add-to-cart-button");
    await user.click(addToCartButton);

    expect(axios.post).toHaveBeenCalledWith("/cart", {
      productId: "e43638ce-6aa0-4b85-b27f-e1d07eb678c6",
      quantity: 1,
    });
    expect(fetchCart).toHaveBeenCalled();
  });
});
```

---

### 2.3 Order Tracking Data Contract Mismatch
- **Location:** [`src/pages/tracking/OrderTracking.jsx:21-48`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/React/ecommerce-project/src/pages/tracking/OrderTracking.jsx#L21-L48)
- **Issue:** Frontend calls `.find()` directly on `response.data`, throwing an error when backend returns an object `{ order: {...}, items: [...] }`.

#### Solution
In [`src/pages/tracking/OrderTracking.jsx`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/React/ecommerce-project/src/pages/tracking/OrderTracking.jsx#L21-L48):
```javascript
async function fetchOrder() {
  try {
    setIsLoading(true);
    const response = await axios.get(`/checkout/orders/${orderID}`);
    const orderData = response.data.order || response.data;
    const items = response.data.items || (Array.isArray(response.data) ? response.data : [orderData]);

    setOrder(orderData);

    const product = items.find(
      (item) => String(item.product_id) === String(productID),
    );

    if (!product) {
      setErrorMessage("Product not found in this order.");
      return;
    }

    setTrackedProduct(product);
  } catch (error) {
    console.error("Error fetching data ", error);
    setErrorMessage(
      error.response?.data?.message || "Failed to fetch order tracking details.",
    );
  } finally {
    setIsLoading(false);
  }
}
```

---

### 2.4 Broken Navigation Link in Order Tracking
- **Location:** [`src/pages/tracking/OrderTracking.jsx:54, 84`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/React/ecommerce-project/src/pages/tracking/OrderTracking.jsx#L54)
- **Issue:** Links target `<Link to="/orders">` instead of `/checkout/orders`.

#### Solution
Change line 54 and line 84 in [`OrderTracking.jsx`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/React/ecommerce-project/src/pages/tracking/OrderTracking.jsx) to:
```jsx
<Link className="back-to-orders-link link-primary" to="/checkout/orders">
  View all orders
</Link>
```

---

### 2.5 Orders Page Delivery Date Displays "Invalid Date"
- **Location:** [`src/pages/order/OrderContainer.jsx:39-53`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/React/ecommerce-project/src/pages/order/OrderContainer.jsx#L39-L53)
- **Issue:** `item.estimated_delivery_days` is `undefined`, causing `dayjs(NaN)` to output `"Invalid Date"`.

#### Solution
In [`src/pages/order/OrderContainer.jsx`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/React/ecommerce-project/src/pages/order/OrderContainer.jsx#L39-L53), utilize `item.date_receive_ms`:
```jsx
<div className="product-delivery-date">
  Arriving on:{" "}
  {item.date_receive_ms
    ? dayjs(Number(item.date_receive_ms)).format("dddd, MMMM D")
    : dayjs(order.created_at).add(3, "day").format("dddd, MMMM D")}
</div>
```

---

### 2.6 JSX Attribute Warnings: `class` Used Instead of `className`
- **Location:**
  - [`src/pages/order/OrdersPage.jsx`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/React/ecommerce-project/src/pages/order/OrdersPage.jsx)
  - [`src/pages/order/OrderContainer.jsx`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/React/ecommerce-project/src/pages/order/OrderContainer.jsx)

#### Solution
Replace all `class="` with `className="` in both files.

---

### 2.7 Unsafe Property Access on Auth Failure
- **Location:**
  - [`src/pages/auth/LoginPage.jsx:28-34`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/React/ecommerce-project/src/pages/auth/LoginPage.jsx#L28-L34)
  - [`src/pages/auth/SignupPage.jsx:28-35`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/React/ecommerce-project/src/pages/auth/SignupPage.jsx#L28-L35)

#### Solution
Use optional chaining with safe fallbacks:
```javascript
catch (error) {
  console.error(error);
  if (error.response) {
    setErrorMessage(error.response.data?.message || "An error occurred");
    if (error.response.data?.oldInput?.email) {
      setEmail(error.response.data.oldInput.email);
    }
  } else {
    setErrorMessage("Unable to connect to server");
  }
}
```

---

### 2.8 ESLint Hook Rule Violation in `OrderTracking.jsx`
- **Location:** [`src/pages/tracking/OrderTracking.jsx:16-20`](file:///D:/Documents/Udemy/React%20+%20Node%20+%20REST/React/ecommerce-project/src/pages/tracking/OrderTracking.jsx#L16-L20)
- **Issue:** Synchronously calling `setIsLoading(false)` inside `useEffect` triggers `react-hooks/set-state-in-effect`.

#### Solution
Initialize loading state based on whether `orderID` is present:
```javascript
const [isLoading, setIsLoading] = useState(Boolean(orderID));

useEffect(() => {
  if (!orderID) return;

  async function fetchOrder() {
    // ...
  }

  fetchOrder();
}, [orderID, productID]);
```

---

## 3. Architecture & Security Observations

1. **Session Store:** Replace the default in-memory session store (`MemoryStore`) with `connect-pg-simple` to store sessions in PostgreSQL for persistence across server restarts.
2. **Environment Variables:** Migrate hardcoded email addresses (`joshua250426.work@gmail.com`) to `process.env.EMAIL_FROM`.
3. **Vite Proxy Scoping:** In `vite.config.js`, scope proxy rules under `/api` rather than `'/'` to avoid collisions between client-side routing and backend assets.
