-- Follow-up to 20260910000000_visual_property_media.sql, not a squash of it
-- (that migration is already applied to the real project -- see CLAUDE.md's
-- rule against editing an applied migration). Flagged by the post-migration
-- advisor sweep, matching this project's existing practice of indexing
-- every foreign key (see 20260908000300_foreign_key_indexes.sql).
create index visual_annotations_created_by_idx on visual_annotations (created_by);
