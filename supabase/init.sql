-- Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- Create a table to store your Google Drive documents
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  embedding vector(768) -- Google's text-embedding-004 outputs 768 dimensions
);

-- Create a function to similarity search for documents
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.title,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
