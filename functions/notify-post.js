import { requireAdmin } from './_utils/auth.js';
import { sendDiscordEmbed } from './_utils/discord.js';

export async function onRequestPost(context) {
  const { env, request } = context;

  const user = await requireAdmin(request);
  if (!user) return new Response('Não autorizado', { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response('Corpo inválido', { status: 400 });
  }

  const action = String(body.action || 'criado').slice(0, 20); // criado | editado | excluído
  const text = String(body.text || '').slice(0, 300);
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const titleByAction = {
    criado: '📝 Novo post publicado',
    editado: '✏️ Post editado',
    excluído: '🗑️ Post excluído'
  };

  const embed = {
    title: titleByAction[action] || '📝 Post atualizado',
    color: 14329910,
    fields: [
      { name: 'Horário', value: timestamp, inline: true },
      { name: 'Frase', value: text || '(sem texto)' }
    ]
  };

  try {
    await sendDiscordEmbed(env.DISCORD_POSTS_WEBHOOK, embed);
  } catch (e) {
    return new Response('Falha ao notificar', { status: 502 });
  }

  return new Response('OK', { status: 200 });
}
