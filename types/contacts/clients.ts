export default interface Client {
    uid: string; // client uid
    companyUid?: string; // company uid that the client belongs to

    name: string;

    address?: Array<{
        type: string;   // address type (e.g. "general", "billing", "shipping", etc.)
        street: string;
        postalCode: string;
        city: string;
        country: string;
    }>;

    emails: Array<{
        type: string;   // email type (e.g. "general", "invoice", etc.)
        email: string;  // email address
    }>;

    phoneNumbers: Array<{
        type: string;   // phone number type (e.g. "general", "mobile", "fax", etc.)
        number: string; // phone number
    }>;

    contactPersons?: Array<{
        firstName: string;
        lastName: string;
        dateOfBirth?: Date;
        email?: string;
        phone?: string;
    }>;

    integrations?: {
        lexware?: Array<{  // only for clients that are linked to a lexware client, used for synchronizing client data with lexware
            companyUid: string;   // company uid that the lexware client belongs to
            clientUid  : string;   // client uid in lexware
        }>
    };

    history: Array<{
        date: Date;
        event: string;   // event type (e.g. "created", "updated", "deleted", etc.)
        updatedBy: string; // uid of the user who performed the action
    }>;
}