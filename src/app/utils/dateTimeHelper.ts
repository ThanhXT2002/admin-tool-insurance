// Utility helpers for normalizing date/time values before sending to API.
// toIsoOrUndefined: convert Date-like input to ISO string or undefined when empty/invalid.
export function toIsoOrUndefined(v: any): string | undefined {
    // treat null/undefined/empty string as absent
    if (
        v === null ||
        typeof v === 'undefined' ||
        (typeof v === 'string' && v.trim() === '')
    )
        return undefined;

    // if already a Date
    const d = v instanceof Date ? v : new Date(v);
    if (isNaN(d.getTime())) return undefined;

    return d.toISOString();
}

export default toIsoOrUndefined;
