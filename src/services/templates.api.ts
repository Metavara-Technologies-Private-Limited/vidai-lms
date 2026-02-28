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
  audience_name: string;
  use_case: string;
  email_body: string;
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

type TemplatePayload = FormData | Record<string, unknown>;

const TemplateService = {
  /**
   * List all templates of a specific type
   * GET /api/templates/{type}/
   */
  getTemplates: async (type: APITemplateType) => {
    const response = await http.get(`/templates/${type}/`);
    return response.data;
  },

  /**
   * Get a specific template by ID
   * GET /api/templates/{type}/{templateId}/
   */
  getTemplateById: async (type: APITemplateType, templateId: string) => {
    const response = await http.get(`/templates/${type}/${templateId}/`);
    return response.data;
  },

  /**
   * Create a new template.
   * POST /api/templates/{type}/create/
   *
   * Sends as multipart/form-data if payload is FormData,
   * otherwise sends as JSON.
   */
  createTemplate: async (type: APITemplateType, data: TemplatePayload) => {
    const config = data instanceof FormData
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : undefined;
    const response = await http.post(`/templates/${type}/create/`, data, config);
    return response.data;
  },

  /**
   * Update an existing template.
   * PUT /api/templates/{type}/{templateId}/update/
   */
  updateTemplate: async (type: APITemplateType, templateId: string, data: TemplatePayload) => {
    const config = data instanceof FormData
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : undefined;
    const response = await http.put(`/templates/${type}/${templateId}/update/`, data, config);
    return response.data;
  },

  /**
   * Upload a document to an existing template.
   * POST /api/templates/{type}/{templateId}/documents/
   *
   * FIX: Django FK field is named `template` not `template_id`.
   * We send both `template` and `template_id` to cover both naming conventions.
   *
   * Django model: restapi_template_mail_document
   *   columns: id | file | uploaded_at | template_id (FK → template)
   *
   * Django serializer expects:
   *   - `file`     → the uploaded file
   *   - `template` → the UUID/PK of the parent template (FK field name)
   *
   * @example
   *   await TemplateService.uploadTemplateDocument('mail', templateId, file);
   */
  uploadTemplateDocument: async (
    type: APITemplateType,
    templateId: string,
    file: File | FormData
  ) => {
    const payload = new FormData();

    if (file instanceof FormData) {
      // Extract the file from the incoming FormData and rebuild cleanly
      const existingFile = file.get('file');
      if (existingFile instanceof File) {
        payload.append("file", existingFile);
      } else {
        // Fallback: copy all entries
        file.forEach((value, key) => {
          if (key !== 'template_id' && key !== 'template') {
            payload.append(key, value);
          }
        });
      }
    } else {
      // Raw File object passed directly
      payload.append("file", file);
    }

    // Append template reference — send BOTH field name variants to cover
    // Django serializers that use either `template` or `template_id`
    payload.append("template", templateId);
    payload.append("template_id", templateId);

    // Debug log — verify file and template id are present before sending
    console.group(`📎 uploadTemplateDocument [${type}] id=${templateId}`);
    payload.forEach((value, key) => {
      if (value instanceof File) {
        console.log(`  ${key}: File(name=${value.name}, size=${value.size}, type=${value.type})`);
      } else {
        console.log(`  ${key}:`, value);
      }
    });
    console.groupEnd();

    const response = await http.post(
      `/templates/${type}/${templateId}/documents/`,
      payload,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return response.data;
  },

  /**
   * Delete a template.
   * DELETE /api/templates/{type}/{templateId}/delete/
   */
  deleteTemplate: async (type: APITemplateType, templateId: string) => {
    console.log('🗑️ Deleting template:', { type, templateId });
    return await http.delete(`/templates/${type}/${templateId}/delete/`);
  },
};

export default TemplateService;