CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT
);

CREATE TABLE credit_cards (
  id SERIAL PRIMARY KEY,
  cc_number TEXT
);

CREATE TABLE health_info (
  id SERIAL PRIMARY KEY,
  diagnosis TEXT
);

CREATE TABLE chat_logs (
  id SERIAL PRIMARY KEY,
  api_key TEXT
);

CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  phone_number TEXT
);
CREATE TABLE ssn_data (
  id SERIAL PRIMARY KEY,
  ssn TEXT
);
