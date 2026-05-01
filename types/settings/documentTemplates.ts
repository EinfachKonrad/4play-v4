export default interface DocumentTemplate {
    uuid: string;
    name: string;
    type: 'sticker' | 'stationery' | 'other'; // Type of document template

    data: string; // HTML template data for the PDF generation

    link?: {
        service: 'lexware' | 'other'; // External service this template is linked to
        companyUuid: string; // UUID of the company this template is linked to
        templateId: string; // ID of the template in the external service
    }

    history: Array<{
        date: Date;
        event: string;
        description?: string;
        updatedBy: string; // User ID of the person who made the change
    }>;
}