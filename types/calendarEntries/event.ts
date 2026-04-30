export default interface Event {
    uuid: string; // event uuid (e-xxx)

    companyUuid: string; // company uuid (c-xxx) that the event belongs to
    clientUuid?: string;  // client uuid (cl-xxx) that the event belongs to (optional, can be left empty if the event is not associated with a specific client)

    name: string;
    description: string;

    venue?: {
        name?: string; // venue name if edited or not selected from the list
        uuid?: string;  // venue uuid (v-xxx) if selected from the list, otherwise it can be left empty and the name can be set to a custom value
    };

    projects: Array<{
        uuid: string;

        name: string;

        companyUuid?: string; // company uuid (c-xxx) if the project is associated with a different company than the main event, otherwise it can be left empty
        clientUuid?: string; // client uuid (cl-xxx) if the project is associated with a different client than the main event, otherwise it can be left empty

        dates: Array<{ // multiple date ranges can be added for a project, e.g. for a multi-day event with breaks in between
            start: string;
            end: string;
        }>;

        equipment: {
            groups: Array<{
                name: string; // group name (e.g. "Audio", "Video", "Lighting")
                bookingDuration: {
                    entireProject: boolean;  // if true, the equipment will be booked for the entire project duration, otherwise it will be booked for the specified time ranges
                    dates?: Array<{
                        start: string;
                        end: string;
                    }>;
                    accountingDuration: {
                        entireProject: boolean;  // if true, the equipment will be accounted for the entire project duration, otherwise it will be accounted for the specified number of days
                        days?: number;    // number of days the equipment will be accoounted for (useful when the rental company charges by the day of use, e.g. for a 3-day event with one setup day and one break day, the accounting duration can be set to 1 day to reflect the actual rental cost)
                    }
                }

                bookedEqipment: Array<{
                    uuid: string;   // equipment uuid (b-xxx, i-xxx or t-xxx)
                    name?: string;   // equipment name if edited or text if it's a text line
                    quantity: number;   // quantity of the equipment booked (for text lines, it can be set to 0 to just be a comment or to any other number to look like a normal booking
                    versionUuid?: string;   // version uuid (v-xxx) if the equipment has different versions and a specific version is booked
                    optionalContent?: Array<string>;  // only for bundles, list of uuids of optional contents that are included in the booking
                    elements?: Array<{ // only for scanned equipment
                        uuid: string;   // element uuid
                        status: "packed" | "checked" | "returned";   // element status (packed: commisioned in warehouse, checked: qc-ed on site after the event - ready to use, returned: returned to warehouse)
                        updatedBy: string; // user uuid (u-xxx) who updated the status last time
                    }>
                }>;

            }>
        };

        crew: {
            positions?: Array<{
                uuid: string;   // position uuid (p-xxx)
                dates: Array<{
                    uuid: string;   // date uuid (d-xxx)
                    start: Date;  // date and time of the start of the position on that date
                    end: Date;    // date and time of the end of the position on that date
                    minCrew?: number;   // minimum number of crew members needed for the position on that date
                }>
            }>;
            bookedCrew: Array<{
                uuid: string;   // crew member uuid (u-xxx)
                dates: Array<{
                    dateUuid: string;   // date uuid (d-xxx) of the crew member's involvement in the project
                    positionUuid: string;    // crew member position uuid (p-xxx)
                }>
            }>;
        }

        timetable: {
            events: Array<{
                name: string;   // event name (e.g. "Setup", "Rehearsal", "Show", "Teardown")
                description?: string;    // event description (optional)
                start: Date;  // event start date and time
                end: Date;    // event end date and time
            }>
        }

        calculation: {
            importEquipment: boolean;   // if true, the equipment booked for the project will be included in the cost calculation, otherwise it will be ignored (useful for projects that are not charged for equipment, e.g. internal projects or projects with a fixed price)
            importCrew: boolean;    // if true, the crew booked for the project will be included in the cost calculation, otherwise it will be ignored (useful for projects that are not charged for crew, e.g. internal projects or projects with a fixed price)

            positions: Array<{
                uuid: string;   // position uuid (p-xxx)
                
                name?: string;   // position name if edited or text if it's not linked to a specific equipment or crew role
                category?: string;   // position category (e.g. Equipment, Crew, Planning, ...) if it's not linked to a specific equipment or crew role

                linked?: {
                    type: "equipment" | "crew";   // type of the linked item (equipment or crew)
                    uuid: string;   // uuid of the linked item (b-xxx, i-xxx, t-xxx for equipment or u-xxx for crew)
                }

                quantity: number;   // quantity of the position (for text lines, it can be set to 0 to just be a comment or to any other number to look like a normal position)
                price: number;  // price per unit of the position
                unit: string;    // unit of the position (e.g. "day", "hour", "item")

                discount?: {
                    type: "percentage" | "fixed";   // type of the discount (percentage or fixed amount)
                    value: number;  // value of the discount (e.g. 10 for 10% or 50 for $50)
                };
            }>

        }            
    }>;

}

