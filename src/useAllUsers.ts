import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient.ts';
import { User } from './users';

export function useAllUsers() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  useEffect(() => {
    supabase.from('users').select('*').then(({ data }) => {
      if (data) setAllUsers(data);
    });
  }, []);
  return allUsers;
}
