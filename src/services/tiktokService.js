const axios = require('axios');

class TikTokService {
  constructor(accessToken, advertiserId) {
    this.accessToken = accessToken;
    this.advertiserId = advertiserId;
    this.baseUrl = 'https://business-api.tiktok.com/open_api/v1.3/';
  }

  async sendLead(leadData) {
    try {
      // Exemplo de endpoint fictício para envio de leads
      const response = await axios.post(
        `${this.baseUrl}lead/submit/`,
        {
          advertiser_id: this.advertiserId,
          lead_info: leadData,
        },
        {
          headers: {
            'Access-Token': this.accessToken,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar lead para TikTok:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = TikTokService;