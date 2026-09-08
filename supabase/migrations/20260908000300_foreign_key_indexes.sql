-- Performance optimization pass. Supabase's performance advisor flags 26
-- foreign keys with no covering index -- these matter for JOIN performance
-- and, more importantly here, for how fast Postgres can check for
-- referencing rows on a CASCADE delete (deleting a property or asset is a
-- real, user-facing action in this app). The other advisor findings from
-- the same run ("unused index") are expected noise for a pre-launch project
-- with near-zero real query traffic and are not acted on here.

create index assets_asset_category_id_idx on assets (asset_category_id);
create index assets_created_by_idx on assets (created_by);
create index assets_vendor_id_idx on assets (vendor_id);

create index attachments_property_id_idx on attachments (property_id);
create index attachments_uploaded_by_idx on attachments (uploaded_by);
create index attachments_warranty_id_idx on attachments (warranty_id);

create index audit_events_actor_user_id_idx on audit_events (actor_user_id);

create index expenses_attachment_id_idx on expenses (attachment_id);
create index expenses_created_by_idx on expenses (created_by);
create index expenses_record_id_idx on expenses (record_id);
create index expenses_vendor_id_idx on expenses (vendor_id);

create index extraction_jobs_created_by_idx on extraction_jobs (created_by);
create index extraction_jobs_input_attachment_id_idx on extraction_jobs (input_attachment_id);

create index organizations_created_by_idx on organizations (created_by);

create index properties_created_by_idx on properties (created_by);

create index property_transfers_accepted_by_user_id_idx on property_transfers (accepted_by_user_id);
create index property_transfers_accepted_organization_id_idx on property_transfers (accepted_organization_id);
create index property_transfers_initiated_by_idx on property_transfers (initiated_by);

create index record_tags_tag_id_idx on record_tags (tag_id);

create index records_created_by_idx on records (created_by);
create index records_space_id_idx on records (space_id);
create index records_unit_id_idx on records (unit_id);
create index records_vendor_id_idx on records (vendor_id);

create index reminders_asset_id_idx on reminders (asset_id);
create index reminders_created_by_idx on reminders (created_by);

create index warranties_created_by_idx on warranties (created_by);
