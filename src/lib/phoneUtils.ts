/**
 * Normalizes Nigerian phone numbers to the format: 234XXXXXXXXXX
 * - Removes all spaces and special characters
 * - Converts 0XXXXXXXXXX to 234XXXXXXXXXX
 * - Removes + from +234XXXXXXXXXX
 * - Keeps 234XXXXXXXXXX as is
 */
export function normalizeNigerianPhone(phone: string): string {
  if (!phone) return "";

  // Remove all spaces and special characters (keep only digits and +)
  let cleaned = phone.replace(/[^\d+]/g, "");

  // Remove + if present
  cleaned = cleaned.replace(/\+/g, "");

  // If starts with 0, replace with 234
  if (cleaned.startsWith("0")) {
    cleaned = "234" + cleaned.substring(1);
  }

  // If doesn't start with 234, add it (assuming it's a local number without prefix)
  if (!cleaned.startsWith("234") && cleaned.length === 10) {
    cleaned = "234" + cleaned;
  }

  return cleaned;
}
