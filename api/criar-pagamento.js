// ============================================================
//  BACKEND MERCADO PAGO — Walter & Flores
//  Cria o pagamento (Pix, cartão ou boleto) com o
//  TOTAL = produto + frete.
//
//  ATIVAÇÃO:
//  1) Painel do Mercado Pago > Credenciais de produção > copie o ACCESS TOKEN.
//  2) No Vercel: Settings > Environment Variables:
//        MP_ACCESS_TOKEN = (cole o token)   [nunca coloque no código]
//
//  Cada pedido leva um "external_reference" (ex.: WF-20260728-A7K3).
//  É por ele que o site pergunta ao Mercado Pago se o pagamento caiu,
//  em /api/status-pagamento — por isso NÃO é preciso webhook nem
//  banco de dados.
// ============================================================

function baseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  const TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!TOKEN) return res.status(500).json({ erro: 'MP_ACCESS_TOKEN não configurado no Vercel' });

  try {
    const { titulo, valor, entrega, ref } = req.body || {};
    if (!titulo || !valor || Number(valor) <= 0) {
      return res.status(400).json({ erro: 'Pedido inválido' });
    }

    // Referência do pedido — o site usa isto para acompanhar o pagamento.
    const external_reference = String(ref || `WF-${Date.now()}`).slice(0, 60);

    const site = baseUrl(req);
    const volta = `${site}/?pedido=${encodeURIComponent(external_reference)}`;

    // valor JÁ vem com o frete somado (calculado no site).
    const preferencia = {
      items: [{
        title: String(titulo).slice(0, 250),
        quantity: 1,
        unit_price: Number(valor),
        currency_id: 'BRL'
      }],
      external_reference,
      // guarda o endereço de entrega junto ao pagamento (aparece no painel MP)
      metadata: entrega ? {
        pedido: external_reference,
        regiao: entrega.regiao,
        frete: entrega.frete,
        endereco: `${entrega.rua || ''}, ${entrega.num || ''} ${entrega.ref ? '- ' + entrega.ref : ''}`.trim(),
        cliente: entrega.nome || ''
      } : { pedido: external_reference },
      back_urls: {
        success: `${volta}&status=ok`,
        failure: `${volta}&status=falhou`,
        pending: `${volta}&status=pendente`
      },
      statement_descriptor: 'WALTERFLORES'
    };

    // auto_return só é aceito pelo Mercado Pago com URL https (não vale localhost)
    if (site.startsWith('https://')) preferencia.auto_return = 'approved';

    const resp = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(preferencia)
    });

    const pref = await resp.json();
    if (!resp.ok) return res.status(502).json({ erro: 'Falha ao criar pagamento', detalhe: pref });

    return res.status(200).json({
      init_point: pref.init_point,
      preference_id: pref.id,
      external_reference
    });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno', detalhe: String(err) });
  }
}
