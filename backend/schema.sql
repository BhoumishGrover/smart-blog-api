CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    original_url TEXT UNIQUE NOT NULL,
    source TEXT CHECK (source IN ('original', 'updated', 'llm-rewrite')) DEFAULT 'original',
    original_article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);