// ============================================================
//  BACKEND MERCADO PAGO — Walter & Flores
//  Função serverless para Vercel. Gera link + QR de pagamento.
//
//  COMO ATIVAR:
//  1) No painel do Mercado Pago (Suas integrações), copie o
//     ACCESS TOKEN DE PRODUÇÃO da conta do lojista.
//  2) No Vercel: Settings > Environment Variables, crie
//        MP_ACCESS_TOKEN = (cole o token aqui)
//     NUNCA coloque o token direto neste arquivo.
//  3) No index.html, defina  const MP_ENDPOINT = '/api/criar-pagamento';
// ============================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }
  const TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!TOKEN) {
    return res.status(500).json({ erro: 'MP_ACCESS_TOKEN não configurado no Vercel' });
  }

  try {
    const { titulo, valor } = req.body || {};
    if (!titulo || !valor || Number(valor) <= 0) {
      return res.status(400).json({ erro: 'Pedido inválido (título e valor > 0 são obrigatórios)' });
    }

    // Cria a preferência de pagamento no Mercado Pago
    const resp = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{
          title: String(titulo).slice(0, 250),
          quantity: 1,
          unit_price: Number(valor),
          currency_id: 'BRL'
        }],
        // Ajuste as URLs de retorno conforme o domínio final:
        back_urls: {
          success: 'https://wfcatalogo.vercel.app/?status=ok',
          failure: 'https://wfcatalogo.vercel.app/?status=falhou',
          pending: 'https://wfcatalogo.vercel.app/?status=pendente'
        },
        auto_return: 'approved'
      })
    });

    const pref = await resp.json();
    if (!resp.ok) {
      return res.status(502).json({ erro: 'Falha ao criar pagamento', detalhe: pref });
    }

    // init_point = link de pagamento. Para QR, use a API de Pix se desejar.
    return res.status(200).json({
      init_point: pref.init_point,
      preference_id: pref.id
    });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno', detalhe: String(err) });
  }
}
