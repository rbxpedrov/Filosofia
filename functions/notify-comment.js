export async function onRequestPost(context) {
  const { env, request } = context;
  const webhookUrl = env.DISCORD_WEBHOOK_COMMENTS;

  if (!webhookUrl) {
    return new Response('Webhook não configurado', { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response('Corpo inválido', { status: 400 });
  }

  const authorName = String(body.authorName || 'Anônimo').slice(0, 60);
  const text = String(body.text || '').slice(0, 500);
  const postText = String(body.postText || '').slice(0, 150);
  const isReply = !!body.isReply;
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const payload = {
    embeds: [{
      title: isReply ? '💬 Nova resposta' : '💬 Novo comentário',
      color: 14329910,
      fields: [
        { name: 'Nome', value: authorName, inline: true },
        { name: 'Horário', value: timestamp, inline: true },
        { name: 'Frase', value: postText || '(não encontrada)' },
        { name: 'Comentário', value: text }
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
