import { requireAdmin } from './_utils/auth.js';
import { sendDiscordFile, sendDiscordEmbed } from './_utils/discord.js';

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

  const records = Array.isArray(body.records) ? body.records : [];
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `backup-posts-${dateStr}.json`;

  const embed = {
    title: '💾 Backup de posts',
    color: 3900151,
    fields: [
      { name: 'Registros', value: String(records.length), inline: true },
      { name: 'Data', value: dateStr, inline: true }
    ]
  };

  try {
    await sendDiscordFile(env.DISCORD_POSTS_BACKUP_WEBHOOK, filename, JSON.stringify({ generated_at: new Date().toISOString(), count: records.length, posts: records }, null, 2), embed);
  } catch (e) {
    try {
      await sendDiscordEmbed(env.DISCORD_ALERTS_WEBHOOK, {
        title: '🚨 Falha no backup de posts',
        color: 15548997,
        fields: [{ name: 'Erro', value: String(e.message || e).slice(0, 300) }]
      });
    } catch (e2) { /* nada mais a fazer se até o alerta falhar */ }
    return new Response(JSON.stringify({ ok: false, error: String(e.message || e) }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ ok: true, count: records.length }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
