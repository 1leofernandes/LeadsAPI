const express = require('express');
const router = express.Router();
const metaService = require('../services/metaService');
const googleAdsService = require('../services/googleAdsService');

const TikTokService = require('../services/tiktokService');
const tiktokService = new TikTokService(process.env.TIKTOK_ACCESS_TOKEN, process.env.TIKTOK_ADVERTISER_ID);

// Exemp
// await tiktokService.sendLead({ name: 'Leonardo', email: 'teste@email.com' });

// Endpoint para enviar leads manualmente
router.post('/submit', async (req, res) => {
  try {
    const { email, phone, name, source, value, sendTo } = req.body;

    // Validar dados obrigatórios
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const leadData = {
      email,
      phone: phone || '',
      name: name || '',
      source: source || 'direct_api',
      value: value || 10.0,
      currency: 'BRL'
    };

    let results = {};

    // Enviar para plataformas especificadas
    if (!sendTo || sendTo === 'all') {
      // Enviar para todas as plataformas
      const [metaResult, googleResult] = await Promise.allSettled([
        metaService.sendLeadToMeta(leadData),
        googleAdsService.uploadLeadConversion(leadData)
      ]);

      results = {
        meta: metaResult.status === 'fulfilled' ? metaResult.value : metaResult.reason,
        google: googleResult.status === 'fulfilled' ? googleResult.value : googleResult.reason
      };

    } else if (sendTo === 'meta') {
      results.meta = await metaService.sendLeadToMeta(leadData);
    
    } else if (sendTo === 'google') {
      results.google = await googleAdsService.uploadLeadConversion(leadData);
    }

    res.status(200).json({
      success: true,
      message: 'Lead processado com sucesso',
      results
    });

  } catch (error) {
    console.error('Erro ao processar lead:', error);
    res.status(500).json({ error: error.message });
  }
});

// Listar leads processados (simulação)
router.get('/', (req, res) => {
  res.json({
    message: 'API de Leads funcionando',
    endpoints: {
      'POST /api/leads/submit': 'Enviar lead para plataformas',
      'GET /api/leads': 'Status da API'
    }
  });
});

module.exports = router;