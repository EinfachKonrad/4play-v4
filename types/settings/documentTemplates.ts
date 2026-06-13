export default interface DocumentTemplate {
    uid: string;
    name: string;
    type: 'sticker' | 'stationery' | 'other'; // Type of document template

    data: string; // HTML template data for the PDF generation

    link?: {
        service: 'lexware' | 'other'; // External service this template is linked to
        companyUid: string; // UID of the company this template is linked to
        templateUid: string; // UID of the template in the external service
    }

    history: Array<{
        date: Date;
        event: string;
        description?: string;
        updatedBy: string; // User UID of the person who made the change
    }>;
}