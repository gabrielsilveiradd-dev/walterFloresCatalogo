// ============================================================
//  BACKEND MERCADO PAGO — Walter & Flores
//  Gera link (e QR) de pagamento com o TOTAL = produto + frete.
//
//  ATIVAÇÃO:
//  1) Painel do Mercado Pago > Credenciais de produção > copie o ACCESS TOKEN.
//  2) No Vercel: Settings > Environment Variables:
//        MP_ACCESS_TOKEN = (cole o token)   [nunca coloque no código]
//  3) No index.html: const MP_ENDPOINT = '/api/criar-pagamento';
// ============================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  const TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!TOKEN) return res.status(500).json({ erro: 'MP_ACCESS_TOKEN não configurado no Vercel' });

  try {
    const { titulo, valor, entrega } = req.body || {};
    if (!titulo || !valor || Number(valor) <= 0) {
      return res.status(400).json({ erro: 'Pedido inválido' });
    }

    // valor JÁ vem com o frete somado (calculado no site).
    const resp = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{
          title: String(titulo).slice(0, 250),
          quantity: 1,
          unit_price: Number(valor),
          currency_id: 'BRL'
        }],
        // guarda o endereço de entrega junto ao pagamento (aparece no painel MP)
        metadata: entrega ? {
          regiao: entrega.regiao,
          frete: entrega.frete,
          endereco: `${entrega.rua||''}, ${entrega.num||''} ${entrega.ref? '- '+entrega.ref : ''}`.trim(),
          cliente: entrega.nome || ''
        } : {},
        back_urls: {
          success: 'https://walter-flores-catalogo.vercel.app/?status=ok',
          failure: 'https://walter-flores-catalogo.vercel.app/?status=falhou',
          pending: 'https://walter-flores-catalogo.vercel.app/?status=pendente'
        },
        auto_return: 'approved'
      })
    });

    const pref = await resp.json();
    if (!resp.ok) return res.status(502).json({ erro: 'Falha ao criar pagamento', detalhe: pref });

    return res.status(200).json({ init_point: pref.init_point, preference_id: pref.id });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno', detalhe: String(err) });
  }
}
