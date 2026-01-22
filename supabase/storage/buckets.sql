
-- Create a public bucket for user avatars
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true);
