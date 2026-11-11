// src/utils/date.ts

export function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeHHMM(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const today = getTodayISO();
  
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = formatDateToISO(yesterdayDate);

  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';

  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const dateObj = new Date(y, m - 1, d);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[dateObj.getMonth()];
  const currentYear = new Date().getFullYear();

  if (dateObj.getFullYear() === currentYear) {
    return `${d} ${monthName}`;
  }
  return `${d} ${monthName} ${y}`;
}

export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayOfWeekName(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

/**
 * Parses freeform date words:
 * "today", "yesterday", "last Friday", "2 days ago", "12 Nov", "12/11", etc.
 */
export function parseRelativeDate(text: string, baseDate = new Date()): { dateStr: string; matchedText?: string } | null {
  const lower = text.toLowerCase().trim();

  // "today"
  if (/\btoday\b/.test(lower)) {
    return { dateStr: formatDateToISO(baseDate), matchedText: 'today' };
  }

  // "yesterday"
  if (/\byesterday\b/.test(lower)) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - 1);
    return { dateStr: formatDateToISO(d), matchedText: 'yesterday' };
  }

  // "N days ago"
  const daysAgoMatch = lower.match(/\b(\d+)\s+days?\s+ago\b/);
  if (daysAgoMatch) {
    const days = parseInt(daysAgoMatch[1], 10);
    const d = new Date(baseDate);
    d.setDate(d.getDate() - days);
    return { dateStr: formatDateToISO(d), matchedText: daysAgoMatch[0] };
  }

  // "last [day of week]" e.g. "last Friday", "last monday"
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const lastDayMatch = lower.match(/\blast\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (lastDayMatch) {
    const targetDayIndex = dayNames.indexOf(lastDayMatch[1]);
    const currentDayIndex = baseDate.getDay();
    let diff = (currentDayIndex - targetDayIndex + 7) % 7;
    if (diff === 0) diff = 7; // Last week's day
    const d = new Date(baseDate);
    d.setDate(d.getDate() - diff);
    return { dateStr: formatDateToISO(d), matchedText: lastDayMatch[0] };
  }

  // "[day of week]" e.g. "on friday" or just "friday"
  const singleDayMatch = lower.match(/\b(on\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (singleDayMatch && !singleDayMatch[0].includes('fund')) {
    const targetDayIndex = dayNames.indexOf(singleDayMatch[2]);
    const currentDayIndex = baseDate.getDay();
    let diff = (currentDayIndex - targetDayIndex + 7) % 7;
    // If today is Friday and user says Friday, it's today (diff=0), else past day
    const d = new Date(baseDate);
    d.setDate(d.getDate() - diff);
    return { dateStr: formatDateToISO(d), matchedText: singleDayMatch[0] };
  }

  // DD/MM or DD-MM e.g. 12/11 or 12-11
  const ddmMatch = lower.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/);
  if (ddmMatch) {
    const day = parseInt(ddmMatch[1], 10);
    const month = parseInt(ddmMatch[2], 10);
    const year = ddmMatch[3] ? (ddmMatch[3].length === 2 ? 2000 + parseInt(ddmMatch[3], 10) : parseInt(ddmMatch[3], 10)) : baseDate.getFullYear();
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const d = new Date(year, month - 1, day);
      return { dateStr: formatDateToISO(d), matchedText: ddmMatch[0] };
    }
  }

  // "12 Nov", "12 November", "Nov 12", "5th Nov"
  const monthNames: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11
  };
  const monthPattern = Object.keys(monthNames).join('|');

  // "12 Nov" or "12th Nov" or "on 12 Nov"
  const regexDayMonth = new RegExp(`\\b(?:on\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthPattern})(?:\\s+(\\d{4}))?\\b`, 'i');
  const dmMatch = lower.match(regexDayMonth);
  if (dmMatch) {
    const day = parseInt(dmMatch[1], 10);
    const month = monthNames[dmMatch[2].toLowerCase()];
    const year = dmMatch[3] ? parseInt(dmMatch[3], 10) : baseDate.getFullYear();
    const d = new Date(year, month, day);
    return { dateStr: formatDateToISO(d), matchedText: dmMatch[0] };
  }

  // "Nov 12"
  const regexMonthDay = new RegExp(`\\b(?:on\\s+)?(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+(\\d{4}))?\\b`, 'i');
  const mdMatch = lower.match(regexMonthDay);
  if (mdMatch) {
    const month = monthNames[mdMatch[1].toLowerCase()];
    const day = parseInt(mdMatch[2], 10);
    const year = mdMatch[3] ? parseInt(mdMatch[3], 10) : baseDate.getFullYear();
    const d = new Date(year, month, day);
    return { dateStr: formatDateToISO(d), matchedText: mdMatch[0] };
  }

  return null;
}
