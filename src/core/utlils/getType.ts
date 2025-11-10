export function getType(item: unknown) {
  const type = typeof item;

  if (type === 'object') {
    if (Array.isArray(item)) {
      return 'array';
    }

    return 'object';
  }

  return type;
}