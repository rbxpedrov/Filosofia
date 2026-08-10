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

  const message = String(body.message || 'Alerta sem descrição').slice(0, 300);
  const source = String(body.source || 'painel').slice(0, 60);
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const embed = {
    title: '🚨 Alerta do sistema',
    color: 15548997,
    fields: [
      { name: 'Origem', value: source, inline: true },
      { name: 'Horário', value: timestamp, inline: true },
      { name: 'Mensagem', value: message }
    ]
  };

  try {
    await sendDiscordEmbed(env.DISCORD_ALERTS_WEBHOOK, embed);
  } catch (e) {
    return new Response('Alerta salvo, mas falhou o envio ao Discord', { status: 200 });
  }

  return new Response('OK', { status: 200 });
}
