-- Add audit functionality to documents table
-- Run this after the initial documents migration

-- Add new columns for audit functionality
alter table public.documents
add column if not exists filename text,
add column if not exists content text,
add column if not exists document_type text check (document_type in ('commercial_invoice', 'service_agreement')),
add column if not exists audit_result jsonb;

-- Update existing records to have filename from file_name if it exists
update public.documents
set filename = file_name
where filename is null and file_name is not null;

-- Create index for document type queries
create index if not exists documents_document_type_idx on public.documents (document_type);

-- Create index for audit results
create index if not exists documents_audit_result_idx on public.documents using gin (audit_result);

-- Optional: Add a generated column for compliance status
alter table public.documents
add column if not exists compliance_status text generated always as (
  case
    when audit_result->'compliance'->>'status' = 'compliant' then 'compliant'
    when audit_result->'compliance'->>'status' = 'non_compliant' then 'non_compliant'
    when audit_result->'compliance'->>'status' = 'requires_review' then 'requires_review'
    else null
  end
) stored;

create index if not exists documents_compliance_status_idx on public.documents (compliance_status);