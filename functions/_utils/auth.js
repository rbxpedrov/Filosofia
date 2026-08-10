// Verifica se a requisição vem de um administrador autenticado no Supabase.
// Usado por todas as functions administrativas (backups, logs, alertas,
// notificação de posts) para impedir que qualquer visitante anônimo do
// site consiga acionar essas rotas.

const SUPABASE_URL = 'https://xyuvnavwluacycjpxmzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5dXZuYXZ3bHVhY3ljanB4bXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4ODgzMTUsImV4cCI6MjA5OTQ2NDMxNX0.fk3ejDTr7qkaBaYZ1FnEa66D5_G9fE7Wb0jAmAN7JeU';

export async function requireAdmin(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user && user.id ? user : null;
  } catch (e) {
    return null;
  }
}
