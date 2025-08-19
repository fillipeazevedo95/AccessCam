// Usuários pré-cadastrados (mock)
export type User = {
  username: string;
  password: string;
  role: 'ti' | 'prevencao' | 'adm';
  owner?: string;
};

export const users: User[] = [
  { username: 'ti', password: 'Ginseng#13', role: 'ti' },
  { username: 'prevencao', password: 'Ginseng@', role: 'prevencao' },
];
