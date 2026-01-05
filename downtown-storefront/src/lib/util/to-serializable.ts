export function toSerializable<T>(value: T): T {
  if (typeof value === "bigint") {
    return Number(value) as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => toSerializable(item)) as T
  }

  if (value && typeof value === "object") {
    const input = value as Record<string, unknown>
    const output: Record<string, unknown> = {}

    for (const [key, child] of Object.entries(input)) {
      output[key] = toSerializable(child)
    }

    return output as T
  }

  return value
}
