import { http } from "./http";

/**
 * API Template Types (mail, sms, whatsapp)
 * Exported as a named export
 */
export type APITemplateType = 'mail' | 'sms' | 'whatsapp';

/**
 * API Request Interfaces
 */
export interface EmailTemplateRequest {
  audience_name: string; // Matches Swagger 'audience_name'
  use_case: string;
  email_body: string;    // Matches Swagger 'email_body'
  subject: string;
  clinic: number;
  id?: string;
}

export interface SMSTemplateRequest {
  audience_name: string;
  use_case: string;
  email_body: string; 
  clinic: number;
  id?: string;
}

const TemplateService = {
  /**
   * List all templates of a specific type
   * GET /api/templates/{type}/
   */
  getTemplates: async (type: APITemplateType) => {
    const response = await http.get(`/templates/${type}/`);
    // Depending on your http helper, you might need response.data.data or just response.data
    return response.data;
  },

  /**
   * Get a specific template by ID
   */
  getTemplateById: async (type: APITemplateType, templateId: string) => {
    const response = await http.get(`/templates/${type}/${templateId}/`);
    return response.data;
  },

  /**
   * Create a new template
   */
  createTemplate: async (type: APITemplateType, data: any) => {
    // If 'data' is FormData, the header will automatically switch to 'multipart/form-data'
    const response = await http.post(`/templates/${type}/create/`, data);
    return response.data;
},

updateTemplate: async (type: APITemplateType, templateId: string, data: any) => {
    const response = await http.put(`/templates/${type}/${templateId}/update/`, data);
    return response.data;
},

  /**
   * Delete a template
   */
  deleteTemplate: async (type: APITemplateType, templateId: string) => {
    console.log('🗑️ Deleting template:', { type, templateId });
    // Note: delete usually doesn't return data (204 No Content)
    return await http.delete(`/templates/${type}/${templateId}/delete/`);
  },
};

export default TemplateService;