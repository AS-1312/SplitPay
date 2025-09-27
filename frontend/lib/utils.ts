import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { normalize } from "viem/ens";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getCategoryIcon(category: string): string {
  const icons = {
    food: "🍽️",
    transport: "🚗",
    accommodation: "🏠",
    entertainment: "🎬",
    other: "📝",
  };
  return icons[category as keyof typeof icons] || icons.other;
}

export function shortenAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ENS validation utilities
export function isValidEnsName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;

  // Basic ENS name format validation
  const ensRegex = /^[a-z0-9-]+\.eth$/i;
  return ensRegex.test(name.trim());
}

export function normalizeEnsName(name: string): string {
  try {
    const trimmed = name.trim().toLowerCase();
    if (!isValidEnsName(trimmed)) {
      throw new Error('Invalid ENS name format');
    }
    return normalize(trimmed);
  } catch (error) {
    throw new Error('Failed to normalize ENS name');
  }
}

export function validateEnsNameFormat(name: string): { isValid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'ENS name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'ENS name cannot be empty' };
  }

  if (!trimmed.endsWith('.eth')) {
    return { isValid: false, error: 'ENS name must end with .eth' };
  }

  if (trimmed.length < 5) { // minimum: "a.eth"
    return { isValid: false, error: 'ENS name is too short' };
  }

  const name_part = trimmed.slice(0, -4); // remove .eth

  // Check for invalid characters
  if (!/^[a-z0-9-]+$/i.test(name_part)) {
    return { isValid: false, error: 'ENS name contains invalid characters. Only letters, numbers, and hyphens are allowed.' };
  }

  // Check for leading/trailing hyphens
  if (name_part.startsWith('-') || name_part.endsWith('-')) {
    return { isValid: false, error: 'ENS name cannot start or end with a hyphen' };
  }

  return { isValid: true };
}
