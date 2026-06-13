CREATE TABLE IF NOT EXISTS despesas (
  id SERIAL PRIMARY KEY,
  descricao VARCHAR(255) NOT NULL,
  valor NUMERIC(10,2) NOT NULL CHECK (valor > 0),
  categoria VARCHAR(50) NOT NULL,
  data DATE NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_despesas_data ON despesas(data);
CREATE INDEX IF NOT EXISTS idx_despesas_categoria ON despesas(categoria);
