export default interface Supplier {
    uuid: string; // supplier uuid (su-xxx)
    companyUuid?: string; // company uuid (c-xxx) that the supplier belongs to

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

    lexware?: Array<{  // only for suppliers that are linked to a lexware supplier, used for synchronizing supplier data with lexware
        companyUuid: string;   // company uuid (c-xxx) that the lexware supplier belongs to
        supplierId: string;   // supplier id in lexware (e.g. "S12345")
    }>;
}