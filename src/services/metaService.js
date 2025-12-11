const axios = require('axios');

class MetaService {
  constructor() {
    this.accessToken = process.env.META_ACCESS_TOKEN;
    this.adAccountId = process.env.META_AD_ACCOUNT_ID;
    this.baseURL = 'https://graph.facebook.com/v19.0';
  }

  /**
   * Envia lead para Meta Ads (Offline Conversions)
   */
  async sendLeadToMeta(leadData) {
    try {
      console.log('📤 Enviando lead para Meta:', leadData);

      // Validar dados obrigatórios
      if (!leadData.email) {
        throw new Error('Email é obrigatório para Meta Ads');
      }

      // Preparar dados para Meta
      const metaPayload = {
        data: [
          {
            event_name: 'Lead',
            event_time: Math.floor(Date.now() / 1000),
            user_data: {
              em: this.hashData(leadData.email),
              ph: leadData.phone ? this.hashData(leadData.phone) : undefined,
              fn: leadData.name ? this.hashData(leadData.name.split(' ')[0]) : undefined,
              ln: leadData.name ? this.hashData(leadData.name.split(' ').slice(1).join(' ')) : undefined,
              client_ip_address: leadData.ip_address || '127.0.0.1',
              client_user_agent: leadData.user_agent || 'unknown',
              fbc: leadData.fbc || '', // Facebook Click ID
              fbp: leadData.fbp || '', // Facebook Browser ID
            },
            custom_data: {
              lead_source: leadData.source || 'webhook',
              lead_value: leadData.value || 0,
              currency: leadData.currency || 'BRL'
            }
          }
        ]
      };

      // Enviar para Conversions API
      const response = await axios.post(
        `${this.baseURL}/${this.adAccountId}/events`,
        metaPayload,
        {
          params: {
            access_token: this.accessToken
          }
        }
      );

      console.log('✅ Lead enviado para Meta com sucesso:', response.data);
      return response.data;

    } catch (error) {
      console.error('❌ Erro ao enviar lead para Meta:', error.response?.data || error.message);
      throw new Error(`Falha na integração com Meta: ${error.message}`);
    }
  }

  /**
   * Hash de dados para conformidade com Meta (SHA256)
   */
  hashData(data) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
  }

  /**
   * Valida assinatura do webhook do Meta
   */
  validateWebhookSignature(payload, signature) {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.META_APP_SECRET)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  }

  /**
   * Processa webhook do Lead Ads do Facebook
   */
  async processLeadAdWebhook(webhookData) {
    try {
      console.log('Webhook do Lead Ads recebido:', webhookData);

      // Extrair dados do lead do webhook
      const leadData = {
        email: webhookData.email,
        phone: webhookData.phone_number,
        name: webhookData.full_name,
        source: 'facebook_lead_ad',
        form_id: webhookData.form_id,
        ad_id: webhookData.ad_id,
        created_time: webhookData.created_time
      };

      // Enviar para Conversions API
      await this.sendLeadToMeta(leadData);

      return { success: true, leadId: webhookData.leadgen_id };

    } catch (error) {
      console.error('Erro ao processar webhook do Lead Ads:', error);
      throw error;
    }
  }
}

module.exports = new MetaService();