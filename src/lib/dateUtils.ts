/**
 * Format ISO date string to dd/mm/yyyy
 * @param isoDate - ISO date string (e.g., "2025-10-19T17:00:00.000Z" or "2025-10-19")
 * @returns Formatted date string in dd/mm/yyyy format or original value if invalid
 */
export function formatDate(isoDate: string | undefined | null): string {
  if (!isoDate) return '-';
  
  try {
    // Handle both ISO datetime and simple date strings
    const date = new Date(isoDate);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return isoDate;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    return isoDate;
  }
}
