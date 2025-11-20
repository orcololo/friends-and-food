import mongoose from 'mongoose';

/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param id - The ID string to validate
 * @returns true if valid, false otherwise
 */
export function isValidObjectId(id: string): boolean {
  return mongoose.isValidObjectId(id);
}

/**
 * Validates request body fields
 * @param body - The request body object
 * @param requiredFields - Array of required field names
 * @returns Error message if validation fails, null if successful
 */
export function validateRequiredFields(
  body: Record<string, any>,
  requiredFields: string[]
): string | null {
  for (const field of requiredFields) {
    if (!body[field] || (typeof body[field] === 'string' && !body[field].trim())) {
      return `${field} is required`;
    }
  }
  return null;
}

/**
 * Validates email format
 * @param email - The email string to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates string length
 * @param value - The string to validate
 * @param min - Minimum length
 * @param max - Maximum length
 * @returns Error message if validation fails, null if successful
 */
export function validateStringLength(
  value: string,
  min: number,
  max: number,
  fieldName: string = 'Field'
): string | null {
  if (value.length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  if (value.length > max) {
    return `${fieldName} must not exceed ${max} characters`;
  }
  return null;
}

/**
 * Validates rating value (1-5)
 * @param rating - The rating value to validate
 * @returns true if valid, false otherwise
 */
export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

/**
 * Validates coordinate bounds
 * @param lat - Latitude value
 * @param lng - Longitude value
 * @returns Error message if validation fails, null if successful
 */
export function validateCoordinates(lat: number, lng: number): string | null {
  if (lat < -90 || lat > 90) {
    return 'Latitude must be between -90 and 90';
  }
  if (lng < -180 || lng > 180) {
    return 'Longitude must be between -180 and 180';
  }
  return null;
}
