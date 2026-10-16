-- A shared page's re-read names the linked items' records it holds, so an
-- unchanged record is not downloaded again.

-- Each homebrew entry whose snapshot is an object carries rev, the md5 of the
-- snapshot's jsonb text: the record embeds its source and its cards, each with
-- its own revision, and a client cannot rebuild jsonb's text form, so the
-- database names the hash. An entry whose hid p_have maps to that rev comes
-- without its snapshot; an official entry carries no rev. A p_have that is not
-- an object or is over 64 KiB counts as {} (300 entries send about 23 KB).
-- Security invoker, and no body copied: the projection, its img and the
-- GM-only rule stay get_shared_list(text)'s, reached through (text, bigint).
-- docs/decisions/2026-10-15-a-shared-page-re-read-names-its-held-snapshots-by-hash.md.
create function public.get_shared_list(p_token text, p_since bigint, p_have jsonb)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  v jsonb := public.get_shared_list(p_token, p_since);
  v_have jsonb := case when jsonb_typeof(p_have) = 'object'
    and octet_length(p_have::text) <= 65536 then p_have else '{}'::jsonb end;
begin
  if v is null or v ? 'unchanged' then
    return v;
  end if;
  return jsonb_set(v, '{entries}', coalesce((
    select jsonb_agg(case when h.rev is null then e.value
        when v_have ->> (e.value ->> 'hid') = h.rev
          then (e.value - 'snapshot') || jsonb_build_object('rev', h.rev)
        else e.value || jsonb_build_object('rev', h.rev) end
      order by e.n)
    from jsonb_array_elements(v -> 'entries') with ordinality as e(value, n)
    cross join lateral (select case when e.value ? 'hid'
        and jsonb_typeof(e.value -> 'snapshot') = 'object'
        then md5((e.value -> 'snapshot')::text) end as rev) h), '[]'::jsonb));
end;
$$;

revoke execute on function public.get_shared_list(text, bigint, jsonb) from public;
grant execute on function public.get_shared_list(text, bigint, jsonb) to anon, authenticated;
