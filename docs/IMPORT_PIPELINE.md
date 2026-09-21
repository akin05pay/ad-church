# AD Church — Import pipeline

## Objective

Prepare AD Church to receive the official congregation and member registries without coupling the application to a spreadsheet format that is not yet known.

## Safety model

An uploaded CSV first becomes a staging batch. Staging data has no authorization effect.

For congregations:
1. Upload CSV.
2. Review normalized name, slug, parent and address.
3. Accept or reject rows.
4. Apply only accepted rows.

For members:
1. Upload CSV.
2. Run deterministic reconciliation against existing people.
3. Exact matches are identified, but not automatically accepted.
4. Ambiguous and unmatched records remain in manual review.
5. An administrator explicitly accepts rows.
6. Apply only accepted rows.

## Supported aliases

The importer normalizes accents/case and supports common aliases, including:
- member name: nome, nome_completo, full_name, membro
- phone: telefone, celular, whatsapp, phone
- birth date: data_nascimento, nascimento, birth_date
- congregation: congregacao, igreja, unidade, unit_name
- unit parent: setor_slug, parent_slug, unidade_pai_slug

When the real spreadsheets arrive, add their headings as aliases instead of rewriting the import flow.

## Matching

Automatic matching is suggestion-only. Current deterministic signals are:
- exact normalized email;
- exact normalized phone;
- exact normalized full name plus birth date.

More than one candidate becomes ambiguous. No fuzzy-name threshold grants access.

## Cost and privacy

The original file is not stored in Supabase Storage. Canonical staging rows are inserted in small batches. This keeps the first version within a low-cost architecture and avoids duplicating uploaded files.

Large registries can be split into batches. If the real source exceeds the initial web-upload limit, the import transport can later be changed without changing the staging schema.

## Access approval

Self-service requests are restricted to the member role and an active congregation. A trigger materializes approval steps. When no explicit organization rule exists for a congregation member, the fallback first step is local_secretary.

Approving a step is checked against the approver's role and scope inside PostgreSQL. The final step activates membership and the role assignment and writes an audit log.
