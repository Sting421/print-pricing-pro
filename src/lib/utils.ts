import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * RFC3986 compliant version of encodeURIComponent
 * Equivalent to Python's quote_plus function
 */
export function quote(str: string): string {
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/[!'()]/g, escape)
    .replace(/\*/g, '%2A')
}
