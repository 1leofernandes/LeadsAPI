const express = require('express');
const router = express.Router();
const metaService = require('../services/metaService');
const googleAdsService = require('../services/googleAdsService');

// Endpoint para formulários customizados
router.post('/submit', async (req, res) => {
  try {
    const { 
      email, 
      phone, 
      name, 
      source = 'custom_form',
      value = 10.0,
      sendTo = 'all',
      formData = {}
    } = req.body;

    // Validação básica
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email é obrigatório' 
      });
    }

    console.log('📝 Formulário recebido:', { email, name, source });

    const leadData = {
      email,
      phone: phone || '',
      name: name || '',
      source,
      value: parseFloat(value) || 10.0,
      currency: 'BRL',
      form_data: formData,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent') || 'unknown'
    };

    let results = {};

    // Enviar para plataformas baseado na configuração
    if (sendTo === 'all' || sendTo === 'both') {
      const [metaResult, googleResult] = await Promise.allSettled([
        metaService.sendLeadToMeta(leadData),
        googleAdsService.uploadLeadConversion(leadData)
      ]);

      results.meta = metaResult.status === 'fulfilled' ? 
        metaResult.value : { error: metaResult.reason.message };
      results.google = googleResult.status === 'fulfilled' ? 
        googleResult.value : { error: googleResult.reason.message };

    } else if (sendTo === 'meta') {
      results.meta = await metaService.sendLeadToMeta(leadData);
    
    } else if (sendTo === 'google') {
      results.google = await googleAdsService.uploadLeadConversion(leadData);
    }

    res.status(200).json({
      success: true,
      message: 'Formulário processado com sucesso',
      lead_id: `lead_${Date.now()}`,
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error) {
    console.error('❌ Erro ao processar formulário:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno ao processar formulário',
      details: error.message 
    });
  }
});

// Listar forms disponíveis (para debug)
router.get('/', (req, res) => {
  res.json({
    message: 'API de Formulários funcionando',
    endpoints: {
      'POST /api/forms/submit': 'Enviar dados de formulário',
      parameters: {
        email: 'string (obrigatório)',
        phone: 'string (opcional)',
        name: 'string (opcional)',
        source: 'string (opcional)',
        value: 'number (opcional)',
        sendTo: "'all' | 'meta' | 'google' (opcional)"
      }
    }
  });
});

module.exports = router;