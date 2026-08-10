// Helpers para enviar mensagens e arquivos aos webhooks do Discord.
// Os URLs dos webhooks NUNCA ficam no código: vêm sempre de env.* (variáveis
// de ambiente configuradas no painel da Cloudflare Pages).

export async function sendDiscordEmbed(webhookUrl, embed) {
  if (!webhookUrl) throw new Error('Webhook não configurado');
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] })
  });
  if (!res.ok) throw new Error(`Discord respondeu ${res.status}`);
}

export async function sendDiscordFile(webhookUrl, filename, jsonContent, embed) {
  if (!webhookUrl) throw new Error('Webhook não configurado');
  const form = new FormData();
  form.append('payload_json', JSON.stringify({ embeds: embed ? [embed] : [] }));
  const blob = new Blob([jsonContent], { type: 'application/json' });
  form.append('files[0]', blob, filename);

  const res = await fetch(webhookUrl, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Discord respondeu ${res.status}`);
}
