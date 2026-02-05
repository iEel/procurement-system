/**
 * Timezone Utility for Procurement System
 * Strict timezone enforcement: Asia/Bangkok (UTC+7)
 * 24-hour time format
 */

export const TIMEZONE = 'Asia/Bangkok';
export const TIME_FORMAT = '24h';

// Date formatting options
const dateOptions: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
};

const timeOptions: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
};

const dateTimeOptions: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
};

/**
 * Get current date/time in Bangkok timezone
 */
export function nowBangkok(): Date {
    return new Date(new Date().toLocaleString('en-US', { timeZone: TIMEZONE }));
}

/**
 * Format date to Bangkok timezone string (DD/MM/YYYY)
 */
export function formatDate(date: Date | string | null): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('th-TH', dateOptions);
}

/**
 * Format time to Bangkok timezone string (HH:mm:ss) 24-hour
 */
export function formatTime(date: Date | string | null): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('th-TH', timeOptions);
}

/**
 * Format datetime to Bangkok timezone string (DD/MM/YYYY HH:mm:ss)
 */
export function formatDateTime(date: Date | string | null): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('th-TH', dateTimeOptions);
}

/**
 * Format datetime for display (DD/MM/YYYY HH:mm)
 */
export function formatDateTimeShort(date: Date | string | null): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('th-TH', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

/**
 * Format date for Thai display (วัน เดือน ปี)
 * For dates from database that are already in Bangkok timezone,
 * we extract the date part directly to avoid double timezone conversion
 */
export function formatDateThai(date: Date | string | null): string {
    if (!date) return '-';

    // If it's a string from database, parse it carefully
    if (typeof date === 'string') {
        // Extract date parts from ISO string to avoid timezone shift
        const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            const [, year, month, day] = match;
            // Create date using local timezone
            const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            return d.toLocaleDateString('th-TH', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        }
    }

    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('th-TH', {
        timeZone: TIMEZONE,
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date | string | null): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    // Get Bangkok time components
    const bangkokDate = new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));
    const year = bangkokDate.getFullYear();
    const month = String(bangkokDate.getMonth() + 1).padStart(2, '0');
    const day = String(bangkokDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Parse date input to Bangkok timezone Date object
 */
export function parseDateInput(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    // Create date in Bangkok timezone
    const date = new Date();
    date.setFullYear(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
}

/**
 * Get start of day in Bangkok timezone
 */
export function startOfDayBangkok(date: Date | string): Date {
    const d = typeof date === 'string' ? new Date(date) : date;
    const bangkokDate = new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));
    bangkokDate.setHours(0, 0, 0, 0);
    return bangkokDate;
}

/**
 * Get end of day in Bangkok timezone
 */
export function endOfDayBangkok(date: Date | string): Date {
    const d = typeof date === 'string' ? new Date(date) : date;
    const bangkokDate = new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));
    bangkokDate.setHours(23, 59, 59, 999);
    return bangkokDate;
}

/**
 * Get current YYMM for document numbering
 */
export function getCurrentYYMM(): string {
    const now = nowBangkok();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}${month}`;
}

/**
 * Convert UTC date from database to Bangkok timezone for display
 */
export function utcToBangkok(utcDate: Date | string): Date {
    const d = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
    return new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));
}

/**
 * Get SQL expression for current Bangkok time
 * Use this in INSERT/UPDATE statements for createdAt/updatedAt
 */
export function getBangkokNowSQL(): string {
    return "SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time'";
}

/**
 * Get Bangkok timezone ISO string for database operations
 */
export function getBangkokISOString(): string {
    const now = new Date();
    const bangkokTime = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
    return bangkokTime.toISOString();
}
