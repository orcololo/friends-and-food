/**
 * Generate an .ics (iCalendar) file for calendar export
 * Compatible with Google Calendar, Apple Calendar, Outlook, etc.
 */

interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  url?: string;
}

export function generateICS(event: CalendarEvent): string {
  // Format date to iCalendar format: YYYYMMDDTHHMMSSZ
  const formatDate = (date: Date): string => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  };

  // Escape special characters for iCalendar format
  const escape = (str: string): string => {
    return str.replace(/[\\,;]/g, '\\$&').replace(/\n/g, '\\n');
  };

  const now = new Date();
  const dtstamp = formatDate(now);
  const dtstart = formatDate(event.startDate);
  const dtend = formatDate(event.endDate);

  // Generate unique ID for the event
  const uid = `${dtstart}-${Math.random().toString(36).substring(7)}@friendsandfood.app`;

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Friends & Food//Event Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escape(event.title)}`,
  ];

  if (event.description) {
    icsContent.push(`DESCRIPTION:${escape(event.description)}`);
  }

  if (event.location) {
    icsContent.push(`LOCATION:${escape(event.location)}`);
  }

  if (event.url) {
    icsContent.push(`URL:${event.url}`);
  }

  icsContent.push('STATUS:CONFIRMED');
  icsContent.push('SEQUENCE:0');
  icsContent.push('END:VEVENT');
  icsContent.push('END:VCALENDAR');

  return icsContent.join('\r\n');
}

export function downloadICS(event: CalendarEvent, filename: string = 'event.ics') {
  const icsContent = generateICS(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
