const express = require('express');
const router = express.Router();
const metaService = require('../services/metaService');
const googleAdsService = require('../services/googleAdsService');

// Webhook do Meta/Facebook
router.post('/meta', async (req, res) => {
  try {
    console.log('🔔 Webhook Meta recebido:', req.body);

    // Validar assinatura (opcional mas recomendado)
    const signature = req.headers['x-hub-signature-256'];
    if (signature && !metaService.validateWebhookSignature(JSON.stringify(req.body), signature)) {
      return res.status(401).json({ error: 'Assinatura inválida' });
    }

    // Processar webhook baseado no tipo
    const { object, entry } = req.body;

    if (object === 'page') {
      for (const pageEntry of entry) {
        for (const event of pageEntry.messaging || pageEntry.changes || []) {
          // Processar evento de lead
          if (event.leadgen_id) {
            await metaService.processLeadAdWebhook(event);
          }
        }
      }
    }

    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('Erro no webhook Meta:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook do Google
router.post('/google', async (req, res) => {
  try {
    console.log('🔔 Webhook Google recebido:', req.body);

    // Processar lead do Google (Forms, etc)
    const result = await googleAdsService.processGoogleLead(req.body);
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Erro no webhook Google:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook genérico para outras plataformas
router.post('/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const leadData = req.body;

    console.log(`🔔 Webhook ${platform} recebido:`, leadData);

    // Roteamento baseado na plataforma
    switch (platform.toLowerCase()) {
      case 'facebook':
      case 'meta':
      case 'instagram':
        await metaService.sendLeadToMeta(leadData);
        break;
      
      case 'google':
      case 'google-ads':
        await googleAdsService.uploadLeadConversion(leadData);
        break;
      
      default:
        // Enviar para ambas as plataformas
        await Promise.allSettled([
          metaService.sendLeadToMeta(leadData),
          googleAdsService.uploadLeadConversion(leadData)
        ]);
        break;
    }

    res.status(200).json({ success: true, message: 'Lead processado com sucesso' });
  } catch (error) {
    console.error(`Erro no webhook ${platform}:`, error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;