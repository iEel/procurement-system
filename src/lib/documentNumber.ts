import { query, execute } from './db';
import { getCurrentYYMM } from './timezone';
import { getSetting } from './settings';

interface GeneratedNumber {
    number: string;
    yearMonth: string;
    sequence: number;
}

/**
 * Parse document format pattern and generate document number
 * Format supports: PREFIX, YY (year), MM (month), #### (sequence with padding)
 * Example: "PRYYMM####" -> "PR2602001"
 */
function parseFormat(format: string, yearMonth: string, sequence: number): string {
    // Extract prefix (letters before YY or MM)
    const prefixMatch = format.match(/^([A-Z]+)/);
    const prefix = prefixMatch ? prefixMatch[1] : '';

    // Get year and month from yearMonth (YYMM format)
    const yy = yearMonth.substring(0, 2);
    const mm = yearMonth.substring(2, 4);

    // Count how many # for padding
    const hashMatch = format.match(/#+/);
    const hashCount = hashMatch ? hashMatch[0].length : 4;

    // Build the number
    let result = format;

    // Replace YY with year
    result = result.replace(/YY/, yy);

    // Replace MM with month 
    result = result.replace(/MM/, mm);

    // Replace #### with padded sequence
    const sequenceStr = String(sequence).padStart(hashCount, '0');
    result = result.replace(/#+/, sequenceStr);

    return result;
}

/**
 * Generate next document number for PR or PO
 * @param documentType - 'PR' or 'PO'
 * @returns Generated number info
 */
export async function generateDocumentNumber(documentType: 'PR' | 'PO'): Promise<GeneratedNumber> {
    const yearMonth = getCurrentYYMM();

    // Get format from settings
    const formatKey = documentType === 'PR' ? 'PR_NUMBER_FORMAT' : 'PO_NUMBER_FORMAT';
    const defaultFormat = documentType === 'PR' ? 'PRYYMM####' : 'POYYMM####';
    const format = await getSetting(formatKey, defaultFormat);

    // Get or create sequence
    const seqResult = await query<{ lastNumber: number }>(`
        SELECT lastNumber FROM DocumentSequences 
        WHERE documentType = @documentType AND yearMonth = @yearMonth
    `, { documentType, yearMonth });

    let nextNumber = 1;
    if (seqResult.length > 0) {
        nextNumber = seqResult[0].lastNumber + 1;
        await execute(`
            UPDATE DocumentSequences 
            SET lastNumber = @nextNumber, updatedAt = GETDATE()
            WHERE documentType = @documentType AND yearMonth = @yearMonth
        `, { nextNumber, yearMonth, documentType });
    } else {
        await execute(`
            INSERT INTO DocumentSequences (documentType, prefix, yearMonth, lastNumber)
            VALUES (@documentType, @documentType, @yearMonth, 1)
        `, { documentType, yearMonth });
    }

    const documentNumber = parseFormat(format, yearMonth, nextNumber);

    return {
        number: documentNumber,
        yearMonth,
        sequence: nextNumber,
    };
}
