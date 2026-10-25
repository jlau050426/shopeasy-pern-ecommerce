CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  reset_token_hash TEXT,
  reset_token_expiry BIGINT,
  role VARCHAR(20) DEFAULT 'USER'
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT NOT NULL,
  imageurl VARCHAR(255) NOT NULL,
  rating_star DOUBLE PRECISION,
  rating_count INTEGER
);

CREATE TABLE delivery_options (
  id SERIAL PRIMARY KEY,
  delivery_days INTEGER NOT NULL,
  price_dollars NUMERIC
);

CREATE TABLE cart (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  user_id INTEGER NOT NULL,
  delivery_options INTEGER DEFAULT 1,
  UNIQUE (user_id, product_id)
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING_PAYMENT',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  stripe_session_id VARCHAR(255) UNIQUE
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  date_receive_ms BIGINT,
  user_id INTEGER,
  price_dollars NUMERIC DEFAULT 0
);

-- required: the app expects delivery options 1, 2 and 3
INSERT INTO delivery_options (delivery_days, price_dollars) VALUES
  (7, 0),
  (3, 4.99),
  (1, 9.99);