export async function onRequestPost(context) {
  const { env, request } = context;
  const webhookUrl = env.DISCORD_WEBHOOK_VISITS;

  if (!webhookUrl) {
    return new Response('Webhook não configurado', { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response('Corpo inválido', { status: 400 });
  }

  const visitorId = String(body.visitorId || 'desconhecido').slice(0, 40);
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const payload = {
    embeds: [{
      title: '🌐 Nova visita no site',
      color: 14329910,
      fields: [
        { name: 'ID anônimo', value: `\`${visitorId}\``, inline: true },
        { name: 'Horário', value: timestamp, inline: true }
      ]
    }]
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    return new Response('Falha ao notificar', { status: 502 });
  }

  return new Response('OK', { status: 200 });
}
