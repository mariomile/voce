-- Questions to the feedback: tables only the server reads and writes, and the quota functions.
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.questions'::regclass),
  'RLS is enabled on questions'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.question_runs'::regclass),
  'RLS is enabled on question_runs'
);

select * from finish();
rollback;
