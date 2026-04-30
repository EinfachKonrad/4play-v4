export default interface Client {
    uuid: string; // client uuid (cl-xxx)
    companyUuid?: string; // company uuid (c-xxx) that the client belongs to

    name: string;

    address?: Array<{
        type: string;   // address type (e.g. "billing", "shipping", etc.)
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

    lexware?: Array<{  // only for clients that are linked to a lexware client, used for synchronizing client data with lexware
        companyUuid: string;   // company uuid (c-xxx) that the lexware client belongs to
        clientId: string;   // client id in lexware (e.g. "K12345")
    }>;
}