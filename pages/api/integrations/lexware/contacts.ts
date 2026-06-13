import { decryptData, encryptData } from "@/lib/encryprion";
import { ApiRequest, getUidFromQuery, requireMethod, withApi } from "@/lib/middleware";
import clientPromise from "@/lib/mongodb";
import Client from "@/types/contacts/clients";
import Supplier from "@/types/contacts/supplier";
import { NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";

// GET /api/integrations/lexware/contacts?uid=brandingUid

type LexwareContact = {
    id?: string;
    organizationId?: string;
    roles?: {
        customer?: { number?: number };
        vendor?: { number?: number };
    };
    company?: {
        name?: string;
        contactPersons?: Array<{
            firstName?: string;
            lastName?: string;
            emailAddress?: string;
            phoneNumber?: string;
        }>;
    };
    person?: {
        firstName?: string;
        lastName?: string;
    };
    addresses?: Record<string, Array<{
        street?: string;
        zip?: string;
        city?: string;
        countryCode?: string;
    }>>;
    emailAddresses?: Record<string, string[]>;
    phoneNumbers?: Record<string, string[]>;
};

function encryptIfPlain(value: string) {
    const decrypted = decryptData(value);
    return decrypted !== value ? value : encryptData(value);
}

function encryptStringsDeep<T>(value: T): T {
    if (typeof value === "string") {
        return encryptIfPlain(value) as T;
    }

    if (Array.isArray(value)) {
        return value.map((entry) => encryptStringsDeep(entry)) as T;
    }

    if (value && typeof value === "object" && !(value instanceof Date)) {
        const result: Record<string, unknown> = {};

        for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
            result[key] = encryptStringsDeep(nestedValue);
        }

        return result as T;
    }

    return value;
}

function toName(contact: LexwareContact) {
    if (typeof contact.company?.name === "string" && contact.company.name.trim() !== "") {
        return contact.company.name.trim();
    }

    const firstName = typeof contact.person?.firstName === "string" ? contact.person.firstName.trim() : "";
    const lastName = typeof contact.person?.lastName === "string" ? contact.person.lastName.trim() : "";
    const fullName = `${firstName} ${lastName}`.trim();

    return fullName || "Unbekannter Kontakt";
}

function toAddresses(contact: LexwareContact) {
    if (!contact.addresses || typeof contact.addresses !== "object") {
        return [];
    }

    const flattened = Object.entries(contact.addresses).flatMap(([type, entries]) => {
        if (!Array.isArray(entries)) {
            return [];
        }

        return entries
            .filter((address) => address && typeof address === "object")
            .map((address) => ({
                type,
                street: address.street ?? "",
                postalCode: address.zip ?? "",
                city: address.city ?? "",
                country: address.countryCode ?? "",
            }));
    });

    return flattened.filter((address) =>
        Boolean(address.street || address.postalCode || address.city || address.country)
    );
}

function toEmails(contact: LexwareContact) {
    if (!contact.emailAddresses || typeof contact.emailAddresses !== "object") {
        return [];
    }

    return Object.entries(contact.emailAddresses).flatMap(([type, entries]) => {
        if (!Array.isArray(entries)) {
            return [];
        }

        return entries
            .filter((entry) => typeof entry === "string" && entry.trim() !== "")
            .map((entry) => ({ type, email: entry.trim() }));
    });
}

function toPhoneNumbers(contact: LexwareContact) {
    if (!contact.phoneNumbers || typeof contact.phoneNumbers !== "object") {
        return [];
    }

    return Object.entries(contact.phoneNumbers).flatMap(([type, entries]) => {
        if (!Array.isArray(entries)) {
            return [];
        }

        return entries
            .filter((entry) => typeof entry === "string" && entry.trim() !== "")
            .map((entry) => ({ type, number: entry.trim() }));
    });
}

function toContactPersons(contact: LexwareContact) {
    const persons = contact.company?.contactPersons;
    if (!Array.isArray(persons)) {
        return undefined;
    }

    const mapped = persons
        .filter((person) => person && typeof person === "object")
        .map((person) => ({
            firstName: person.firstName?.trim() ?? "",
            lastName: person.lastName?.trim() ?? "",
            ...(person.emailAddress ? { email: person.emailAddress.trim() } : {}),
            ...(person.phoneNumber ? { phone: person.phoneNumber.trim() } : {}),
        }))
        .filter((person) => Boolean(person.firstName || person.lastName || person.email || person.phone));

    return mapped.length > 0 ? mapped : undefined;
}

function mapLexwareToClient(contact: LexwareContact, companyUid: string, updatedBy: string): Client {
    return {
        uid: uuidv4(),
        companyUid,
        name: toName(contact),
        address: toAddresses(contact),
        emails: toEmails(contact),
        phoneNumbers: toPhoneNumbers(contact),
        ...(toContactPersons(contact) ? { contactPersons: toContactPersons(contact) } : {}),

        integrations: {
            lexware: contact.id
                ? [{ companyUid, clientUid: contact.id }]
                : undefined,
        },
        history: [
            {
                date: new Date(),
                event: "created",
                updatedBy,
            },
        ],
    };
}

function mapLexwareToSupplier(contact: LexwareContact, companyUid: string): Supplier {
    return {
        uid: uuidv4(),
        companyUid,
        name: toName(contact),
        address: toAddresses(contact),
        emails: toEmails(contact),
        phoneNumbers: toPhoneNumbers(contact),
        ...(toContactPersons(contact) ? { contactPersons: toContactPersons(contact) } : {}),
        integrations: {
            lexware: contact.id
                ? [{ companyUid, supplierUid: contact.id }]
                : undefined,
        },
    };
}

async function fetchAllLexwareContacts(apiKey: string) {
    const allContacts: LexwareContact[] = [];
    let page = 0;
    let hasNextPage = true;

    while (hasNextPage) {
        const response = await fetch(`https://api.lexware.io/v1/contacts?page=${page}&size=250`, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Lexware API responded with status ${response.status}`);
        }

        const payload = await response.json();

        if (Array.isArray(payload)) {
            return payload as LexwareContact[];
        }

        const content = Array.isArray(payload?.content)
            ? (payload.content as LexwareContact[])
            : [];

        allContacts.push(...content);

        if (typeof payload?.last === "boolean") {
            hasNextPage = !payload.last;
            page += 1;
        } else {
            hasNextPage = false;
        }
    }

    return allContacts;
}


async function handler(req: ApiRequest, res: NextApiResponse) {
    requireMethod(req, res, ['GET'])

    const client = await clientPromise
    const brandingUid = getUidFromQuery(req.query.uid)
    const branding = await client.db('settings').collection('brandings').findOne({ uid: encryptData(brandingUid) })
    if (!branding) {
        res.status(404).json({ error: "Branding not found" })
        return
    } else if (!branding.integrations?.lexware?.enabled) {
        res.status(400).json({ error: "Lexware integration is not enabled for this branding" })
        return
    } else if (!branding.integrations.lexware.apiKey) {
        res.status(400).json({ error: "API key for Lexware integration is not set" })
        return
    }

    if (req.method === 'GET') {
        try {
            const lexwareApiKey = decryptData(branding.integrations.lexware.apiKey)
            const data = await fetchAllLexwareContacts(lexwareApiKey)

            if (req.query.syncContacts === 'true') {
                const contactsDb = client.db('contacts')
                const encryptedCompanyUid = encryptIfPlain(brandingUid)

                for (const contact of data) {
                    if (!contact || typeof contact !== "object" || !contact.id) {
                        continue
                    }

                    const contactId = encryptIfPlain(contact.id)

                    if (contact.roles?.customer) {
                        const existingClient = await contactsDb.collection('clients').findOne({
                            lexware: {
                                $elemMatch: {
                                    companyUid: encryptedCompanyUid,
                                    clientUid: contactId,
                                },
                            },
                        })

                        if (!existingClient) {
                            const mappedClient = mapLexwareToClient(contact, brandingUid, req.user?.uid ?? "system")
                            await contactsDb.collection('clients').insertOne(encryptStringsDeep(mappedClient))
                        }
                    }

                    if (contact.roles?.vendor) {
                        const existingSupplier = await contactsDb.collection('suppliers').findOne({
                            lexware: {
                                $elemMatch: {
                                    companyUid: encryptedCompanyUid,
                                    supplierUid: contactId,
                                },
                            },
                        })

                        if (!existingSupplier) {
                            const mappedSupplier = mapLexwareToSupplier(contact, brandingUid)
                            await contactsDb.collection('suppliers').insertOne(encryptStringsDeep(mappedSupplier))
                        }
                    }
                }
            }

            res.status(200).json(data)
        } catch (error) {
            console.error('Error fetching contacts from Lexware:', error)
            res.status(500).json({ error: 'Failed to fetch contacts from Lexware' })
        }


    }
}


export default withApi(handler, {
    requiredPermissions: ['useLexwareIntegration', 'accessCompanySettings', 'manageClients', 'manageSuppliers'],
    allowWildcardPermission: true,
})