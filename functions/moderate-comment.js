// Recebe um comentário anônimo, pergunta ao Gemini se o texto é ofensivo
// (levando em conta o contexto, não só palavras soltas) e já insere no
// Supabase com approved=true/false conforme o resultado. Usa a service
// role key porque a RLS da tabela comments só deixa approved=true ser
// setado por usuário autenticado — aqui quem decide é o servidor, não
// o visitante.

const SUPABASE_URL = 'https://xyuvnavwluacycjpxmzi.supabase.co';

const MODERATION_PROMPT = `Você modera comentários de um blog pessoal sobre fé, Deus e livre-arbítrio.

Regras:
- Palavrão usado como interjeição, desabafo ou ênfase (ex: "porra, que reflexão boa", "caralho, nunca tinha pensado nisso") é PERMITIDO.
- Só bloqueie se o comentário for: xingamento/ofensa direta a alguém, discurso de ódio, assédio, spam/propaganda, ou conteúdo sexual explícito.
- Na dúvida entre permitir e bloquear, permita — um humano revisa os bloqueados depois.

Responda APENAS com um JSON, sem markdown, sem texto extra, no formato:
{"approved": true ou false, "reason": "motivo bem curto"}

Comentário para avaliar:
"""`;

async function classifyWithGemini(apiKey, text) {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: MODERATION_PROMPT + text + '"""' }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 100 }
      })
    }
  );

  if (!resp.ok) {
    throw new Error(`Gemini respondeu ${resp.status}`);
  }

  const data = await resp.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned);
  return { approved: !!parsed.approved, reason: String(parsed.reason || '').slice(0, 200) };
}

export async function onRequestPost(context) {
  const { env, request } = context;

  if (!env.GEMINI_API_KEY) {
    return new Response('GEMINI_API_KEY não configurada', { status: 500 });
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response('SUPABASE_SERVICE_ROLE_KEY não configurada', { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response('Corpo inválido', { status: 400 });
  }

  const philosophyId = body.philosophyId || null;
  const parentId = body.parentId || null;
  const authorName = body.name ? String(body.name).trim().slice(0, 40) : null;
  const text = String(body.text || '').trim().slice(0, 500);

  if (!text) {
    return new Response(JSON.stringify({ ok: false, error: 'Comentário vazio' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  // Se o Gemini falhar (fora do ar, cota estourada, etc.), cai pra
  // pendente em vez de travar o envio do comentário do visitante.
  let approved = false;
  let reason = '';
  try {
    const result = await classifyWithGemini(env.GEMINI_API_KEY, text);
    approved = result.approved;
    reason = result.reason;
  } catch (e) {
    approved = false;
    reason = 'Falha na moderação automática — revisão manual';
  }

  const insertResp = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'return=representation'
    },
    body: JSON.stringify({
      philosophy_id: philosophyId,
      parent_id: parentId,
      author_name: authorName,
      text,
      is_owner: false,
      approved
    })
  });

  if (!insertResp.ok) {
    const errText = await insertResp.text().catch(() => '');
    return new Response(JSON.stringify({ ok: false, error: errText || 'Falha ao salvar comentário' }), {
      status: 502, headers: { 'Content-Type': 'application/json' }
    });
  }

  const [inserted] = await insertResp.json();

  return new Response(JSON.stringify({ ok: true, approved, reason, comment: inserted }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
}
