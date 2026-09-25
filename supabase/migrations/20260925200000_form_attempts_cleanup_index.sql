-- The public form deletes attempts older than an hour at every submission: without an index starting
-- from created_at that delete reads the whole table, shared by every workspace.
create index form_attempts_created_at_idx on private.form_attempts (created_at);
