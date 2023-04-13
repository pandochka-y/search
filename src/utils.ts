export function get(obj: Record<string, any>, path: string, defaultValue: any = undefined) {
  const travel = (regexp: RegExp) =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res: { [x: string]: any } | null | undefined, key: string | number) => ((res !== null && res !== undefined) ? res[key] : res), obj)
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/)
  return (result === undefined || result === obj) ? defaultValue : result
}

// union function for sets
export function union<T>(args: Set<T>[]): Set<T> {
  return new Set(args.reduce((acc, val) => [...acc, ...val], [] as Array<T>))
}

// intersection function for sets
export function intersection<T>(args: Set<T>[]): Set<T> {
  const [first, ...rest] = args
  return new Set([...first].filter(x => rest.every(y => y.has(x))))
}

// difference function for sets
export function difference<T>(args: Set<T>[]): Set<T> {
  const [first, ...rest] = args
  return new Set([...first].filter(x => !rest.some(y => y.has(x))))
}
