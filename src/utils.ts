export function get(obj: Record<string, any>, path: string, defaultValue: any = undefined) {
  return path.split('.').reduce((acc, val) => {
    if (acc === undefined)
      return defaultValue
    return acc[val]
  }, obj)
}

// union function for sets
export function union<T>(args: Set<T>[]): Set<T> {
  return new Set(args.reduce((acc, val) => [...acc, ...val], [] as Array<T>))
}

// intersection function for sets
export function intersection<T>(args: Set<T>[]): Set<T> {
  // console.log(args)

  const [first, ...rest] = args
  return new Set([...first].filter(x => rest.every(y => y.has(x))))
}

// difference function for sets
export function difference<T>(args: Set<T>[]): Set<T> {
  const [first, ...rest] = args
  return new Set([...first].filter(x => !rest.some(y => y.has(x))))
}
