import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Constructs a Google Cloud Storage URL from bucket and object path
 * @param bucket - The GCS bucket name
 * @param objectPath - The object path within the bucket
 * @returns The full GCS URL
 */
export function getGcsUrl(bucket: string, objectPath: string): string {
  return `https://storage.googleapis.com/${bucket}/${objectPath}`
}
