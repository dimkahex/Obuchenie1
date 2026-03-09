CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0
);
INSERT INTO products (name, price, stock) VALUES
  ('Product A', 99.99, 10),
  ('Product B', 49.50, 25),
  ('Product C', 199.00, 5)
ON CONFLICT DO NOTHING;
