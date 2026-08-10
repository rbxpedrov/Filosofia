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

  const action = String(body.action || 'ação_desconhecida').slice(0, 80);
  const result = String(body.result || '—').slice(0, 40);
  const context_ = String(body.context || '').slice(0, 300);
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const colorByResult = { sucesso: 5763719, erro: 15548997, falha_senha: 15548997, cancelado: 10197915 };

  const embed = {
    title: '📋 Ação administrativa',
    color: colorByResult[result] || 9807270,
    fields: [
      { name: 'Ação', value: action, inline: true },
      { name: 'Resultado', value: result, inline: true },
      { name: 'Horário', value: timestamp, inline: true },
      { name: 'Contexto', value: context_ || '—' }
    ]
  };

  try {
    await sendDiscordEmbed(env.DISCORD_ADMIN_LOGS_WEBHOOK, embed);
  } catch (e) {
    // Falha ao notificar não deve travar o fluxo administrativo; o log
    // já foi salvo no Supabase pelo cliente.
    return new Response('Log salvo, mas falhou o envio ao Discord', { status: 200 });
  }

  return new Response('OK', { status: 200 });
}
