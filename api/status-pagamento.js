// ============================================================
//  CONSULTA DE PAGAMENTO — Walter & Flores
//  Substitui o webhook do Mercado Pago (que exigiria banco de dados).
//
//  O site chama este endpoint de 5 em 5 segundos enquanto o cliente
//  está pagando. Aqui perguntamos ao Mercado Pago, com o ACCESS TOKEN
//  do lojista, se aquele pedido já foi aprovado. Assim que a resposta
//  vier "approved", a tela do cliente muda sozinha e mostra a
//  instrução de enviar o comprovante pelo WhatsApp.
//
//  Uso:  GET /api/status-pagamento?ref=WF-20260728-A7K3
//        GET /api/status-pagamento?payment_id=1234567890
// ============================================================

const MP = 'https://api.mercadopago.com';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!TOKEN) return res.status(500).json({ erro: 'MP_ACCESS_TOKEN não configurado no Vercel' });

  const ref = req.query?.ref;
  const paymentId = req.query?.payment_id;
  if (!ref && !paymentId) return res.status(400).json({ erro: 'Informe ref ou payment_id' });

  const auth = { headers: { Authorization: `Bearer ${TOKEN}` } };

  try {
    let pg = null;

    if (paymentId) {
      const r = await fetch(`${MP}/v1/payments/${encodeURIComponent(paymentId)}`, auth);
      if (r.ok) pg = await r.json();
    } else {
      // Busca todas as tentativas de pagamento daquele pedido.
      const url = `${MP}/v1/payments/search?external_reference=${encodeURIComponent(ref)}` +
                  `&sort=date_created&criteria=desc&limit=20`;
      const r = await fetch(url, auth);
      if (!r.ok) {
        const detalhe = await r.json().catch(() => ({}));
        return res.status(502).json({ erro: 'Falha ao consultar o Mercado Pago', detalhe });
      }
      const lista = (await r.json()).results || [];
      // Se qualquer tentativa foi aprovada, é ela que vale.
      pg = lista.find(p => p.status === 'approved') || lista[0] || null;
    }

    if (!pg || !pg.id) {
      // Ainda não existe pagamento registrado — o cliente não finalizou.
      return res.status(200).json({ encontrado: false, pago: false, status: 'aguardando' });
    }

    return res.status(200).json({
      encontrado: true,
      pago: pg.status === 'approved',
      status: pg.status,
      status_detail: pg.status_detail || null,
      payment_id: String(pg.id),
      valor: pg.transaction_amount ?? null,
      metodo: pg.payment_method_id || null,
      external_reference: pg.external_reference || null,
      aprovado_em: pg.date_approved || null
    });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno', detalhe: String(err) });
  }
}
