import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// IST Timezone Utilities (UTC+5:30)
const IST_OFFSET_HOURS = 5.5;
const IST_OFFSET_MS = IST_OFFSET_HOURS * 60 * 60 * 1000;

/**
 * Format a date/time string to IST timezone for display
 * @param dateString - ISO date string from database (UTC)
 * @param includeTime - Whether to include time in output (default: true)
 */
export function formatToIST(dateString: string, includeTime: boolean = true): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  if (includeTime) {
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  }
  
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

/**
 * Convert UTC date string to IST datetime-local input format
 * datetime-local expects: "YYYY-MM-DDTHH:mm"
 * @param utcString - ISO date string from database (UTC)
 */
export function utcToISTInput(utcString: string): string {
  if (!utcString) return '';
  
  const date = new Date(utcString);
  // Convert to IST by adding 5:30 hours
  const istDate = new Date(date.getTime() + IST_OFFSET_MS);
  
  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  const hours = String(istDate.getUTCHours()).padStart(2, '0');
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convert IST datetime-local input value to UTC ISO string for database
 * @param istInputValue - Value from datetime-local input (IST)
 */
export function istInputToUTC(istInputValue: string): string {
  if (!istInputValue) return '';
  
  // Parse the input as IST time
  const [datePart, timePart] = istInputValue.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  // Create date as if it's UTC, then subtract IST offset to get actual UTC
  const istAsUTC = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  const utcTimestamp = istAsUTC - IST_OFFSET_MS;
  
  return new Date(utcTimestamp).toISOString();
}

/**
 * Get current time in IST as ISO string (for database storage)
 */
export function getCurrentISTAsUTC(): string {
  return new Date().toISOString();
}

/**
 * Format IST datetime string (already in IST) for display
 * Use this when database stores time in IST format (like patrol times)
 * @param dateString - ISO date string that's already in IST
 */
export function formatISTDateTime(dateString: string): string {
  if (!dateString) return '';
  
  // Parse the date string
  const date = new Date(dateString);
  
  // Format displaying the UTC values directly (treating stored UTC as local time)
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC', // Force UTC display to match stored string
  });
}

/**
 * Convert IST datetime string to datetime-local input format
 * Use this when database stores time in IST format (like patrol times)
 * @param istString - ISO date string that's already in IST
 */
export function istStringToInput(istString: string): string {
  if (!istString) return '';
  
  const date = new Date(istString);
  
  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  // Use UTC methods to extract the raw stored values
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convert datetime-local input to ISO string (no timezone conversion)
 * Use this when database stores time in IST format (like patrol times)
 * @param inputValue - Value from datetime-local input
 */
export function inputToISTString(inputValue: string): string {
  if (!inputValue) return '';
  
  const [datePart, timePart] = inputValue.split('T');
  if (!datePart || !timePart) return new Date(inputValue).toISOString();

  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  // Create date using UTC to preserve the exact values
  // This results in a string like "...18:11:00.000Z" for input "18:11"
  const date = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  
  return date.toISOString();
}
