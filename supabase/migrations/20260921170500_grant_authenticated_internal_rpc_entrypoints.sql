-- Allow authenticated public RPC wrappers to execute only the intended private entrypoints.
-- The private schema remains unexposed; each function validates auth.uid() and authorization.

grant execute on function private.create_role_invitation(text,uuid,uuid,uuid,uuid) to authenticated;
grant execute on function private.decide_role_invitation(uuid,text) to authenticated;
grant execute on function private.claim_role_invitations() to authenticated;
grant execute on function private.set_role_assignment_status(uuid,text) to authenticated;
grant execute on function private.list_manageable_team(uuid) to authenticated;

grant execute on function private.list_manageable_people(uuid,uuid,text,integer) to authenticated;
grant execute on function private.create_person_with_membership(uuid,uuid,text,text,text,date,text) to authenticated;
grant execute on function private.update_person_record(uuid,text,text,text,date) to authenticated;
grant execute on function private.set_membership_details(uuid,text,text) to authenticated;
grant execute on function private.transfer_membership(uuid,uuid) to authenticated;
