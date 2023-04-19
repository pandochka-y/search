// export function get(obj: Record<string, any>, path: string, defaultValue: any = undefined) {
//   return path.split('.').reduce((acc, val) => {
//     if (acc === undefined)
//       return defaultValue
//     return acc[val]
//   }, obj)
// }

export function get<T, K>(value: T,
  path: string,
  defaultValue: K | null = null): K | null {
  const segments = path.split(/[\.\[\]]/g)
  let current: any = value
  for (const key of segments) {
    if (current === null)
      return defaultValue
    if (current === undefined)
      return defaultValue
    if (key.trim() === '')
      continue
    current = current[key]
  }
  if (current === undefined)
    return defaultValue
  return current
}

export function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, any> {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? `${prefix}.` : ''
    if (typeof obj[k] === 'object')
      Object.assign(acc, flattenObject(obj[k], pre + k))
    else
      acc[pre + k] = obj[k]
    return acc
  }, {} as Record<string, any>)
}

export function unflattenObject(obj: Record<string, any>): Record<string, any> {
  const result = {}
  for (const i in obj) {
    if (!Object.hasOwn(obj, i))
      continue
    const keys = i.split('.')
    keys.reduce((r, e, j) => {
      return r[e] || (r[e] = isNaN(Number(keys[j + 1])) ? (keys.length - 1 === j ? obj[i] : {}) : [])
    }, result)
  }
  return result
}

export function addToMap(m: Map<string, number>, key: string) {
  return m.has(key)
    ? m.set(key, m.get(key) + 1)
    : m.set(key, 1)
}
