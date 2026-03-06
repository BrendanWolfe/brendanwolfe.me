export function buildFormData(model: Record<string, unknown>): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(model)) {
    if (value === undefined || value === null) {
      continue;
    }

    formData.set(key, typeof value === 'string' ? value : String(value));
  }

  return formData;
}

export function getFirstFieldError(fields: Record<string, unknown>): string | null {
  for (const value of Object.values(fields)) {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    if (!Array.isArray(value)) {
      continue;
    }

    const firstString = value.find((entry): entry is string => typeof entry === 'string' && entry.length > 0);
    if (firstString) {
      return firstString;
    }
  }

  return null;
}
