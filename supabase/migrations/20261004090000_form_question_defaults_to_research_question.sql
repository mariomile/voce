-- A new Research's public form asks the Research question, editable in Raccolta.
-- A question longer than the form allows (140) keeps the default form question: cutting it would change its meaning.
-- Existing Research keep their form question untouched.
create or replace function public.create_research(ws uuid, question text)
returns uuid
language plpgsql volatile security definer set search_path = ''
as $$
declare
  workspace_name text;
  clean_question text;
  new_id uuid;
begin
  select w.name into workspace_name from public.workspaces w
  where w.id = ws and w.id in (select private.my_workspace_ids());
  if workspace_name is null then
    raise exception 'not_a_member' using errcode = '42501';
  end if;
  if question is null or char_length(btrim(question)) not between 1 and 200 then
    raise exception 'invalid_question' using errcode = '22023';
  end if;

  clean_question := btrim(create_research.question);
  insert into public.research (workspace_id, question, form_slug, form_question)
  values (
    ws, clean_question, private.new_form_slug(workspace_name),
    case when char_length(clean_question) <= 140 then clean_question end
  )
  returning id into new_id;
  return new_id;
end
$$;
