const { GoogleAdsApi } = require('google-ads-api');


class GoogleAdsService {
  constructor() {
    this.client = new GoogleAdsApi({
      developer_token: process.env.GOOGLE_DEVELOPER_TOKEN,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    this.customerId = process.env.GOOGLE_CUSTOMER_ID;
  }

  /**
   * Envia lead para Google Ads (Conversões Offline)
   */
  async uploadLeadConversion(leadData) {
    try {
      console.log('📤 Enviando lead para Google Ads:', leadData);

      const customer = this.client.Customer({
        customer_id: this.customerId,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      });

      // Criar conversão offline
      const conversionAction = await this.getOrCreateConversionAction();

      const conversion = {
        conversion_action: conversionAction.resource_name,
        conversion_date_time: new Date().toISOString().split('.')[0] + '-03:00',
        conversion_value: leadData.value || 10.0, // Valor padrão R$ 10,00
        currency_code: 'BRL',
        user_identifiers: [
          {
            hashed_email: this.hashData(leadData.email),
          },
        ],
      };

      if (leadData.phone) {
        conversion.user_identifiers.push({
          hashed_phone_number: this.hashData(leadData.phone),
        });
      }

      // Upload da conversão
      const response = await customer.offlineUserDataJobs.uploadOfflineConversion({
        customer_id: this.customerId,
        conversions: [conversion],
        partial_failure: false,
      });

      console.log('✅ Lead enviado para Google Ads com sucesso:', response);
      return response;

    } catch (error) {
      console.error('❌ Erro ao enviar lead para Google Ads:', error);
      throw new Error(`Falha na integração com Google Ads: ${error.message}`);
    }
  }

  /**
   * Obtém ou cria ação de conversão
   */
  async getOrCreateConversionAction() {
    const customer = this.client.Customer({
      customer_id: this.customerId,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    try {
      // Tentar encontrar conversão existente
      const conversions = await customer.query(`
        SELECT conversion_action.resource_name 
        FROM conversion_action 
        WHERE conversion_action.name = 'Web Leads'
      `);

      if (conversions.length > 0) {
        return conversions[0];
      }

      // Criar nova ação de conversão
      const newConversion = await customer.conversionActions.create({
        name: 'Web Leads',
        type: 'UPLOAD_CLICKS',
        category: 'LEAD',
        status: 'ENABLED',
        value_settings: {
          default_value: 10.0,
          always_use_default_value: true,
        },
      });

      return newConversion;

    } catch (error) {
      console.error('Erro ao criar ação de conversão:', error);
      throw error;
    }
  }

  /**
   * Hash de dados para Google Ads (SHA256)
   */
  hashData(data) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
  }

  /**
   * Processa lead do Google Forms ou outros sources
   */
  async processGoogleLead(leadData) {
    try {
      console.log('📩 Processando lead do Google:', leadData);

      const formattedLead = {
        email: leadData.email,
        phone: leadData.phone,
        name: leadData.name,
        value: leadData.value || 10.0,
        source: leadData.source || 'google_form'
      };

      return await this.uploadLeadConversion(formattedLead);

    } catch (error) {
      console.error('Erro ao processar lead do Google:', error);
      throw error;
    }
  }
}

module.exports = new GoogleAdsService();