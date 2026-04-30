export default interface Position {
    uuid: string; // position uuid (po-xxx)
    name: string;    // position name (e.g. "Sound Engineer", "Lighting Technician", "Stage Manager", etc.)
    description?: string; // position description (optional)
    color?: string;   // position color in hex format (e.g. "#FF0000" for red), used for displaying the position in the calendar and on documents
    defaultDayRate?: number;   // default day rate for the position, used for calculating the cost of crew members assigned to this position on a project
}
