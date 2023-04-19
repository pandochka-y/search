import { addToMap, flattenObject } from './utils'

interface IndexOptions {
  id: string
  include?: string[]
  exclude?: string[]
}

export interface IndexQuery {
  select: Record<string, IndexQueryCondition[]>
  include?: string[]
  exclude?: string[]
}

export type IndexQueryCondition = Partial<Record<IndexQueryOperator, any>>
export type IndexQueryOperator =
  | 'eq'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'

export class Index {
  constructor(
    private options: IndexOptions,
    private map: Map<string, Map<string, Array<string>>> = new Map(),
  ) { }

  add(id: string, document: Record<string, any>) {
    Object.entries(flattenObject(document)).forEach(([key, value]) => {
      if (
        this.options.include?.some(path => key.startsWith(path))
         && !this.options.exclude?.includes(key)) {
        if (!this.map.has(key))
          this.map.set(key, new Map())

        const map = this.map.get(key)

        if (!map.has(value))
          map.set(value, [])

        map.get(value)!.push(id)
      }
    })
  }

  search(query: IndexQuery): Array<string> {
    const res = new Map<string, number>()

    for (const [indexPath, conditions] of Object.entries(query.select)) {
      const mapIndex = this.map.get(indexPath)
      const tmp = new Map<string, number>()

      if (!mapIndex)
        return []

      for (const condition of conditions) {
        for (const [operation, value] of Object.entries(condition)) {
          if (operation === 'eq') {
            if (mapIndex.has(value))
              addToMap(tmp, value)
          }
          else {
            for (const key of mapIndex.keys()) {
              switch (operation) {
                case 'lt':
                  if (key < value)
                    addToMap(tmp, key)
                  break
                case 'lte':
                  if (key <= value)
                    addToMap(tmp, key)
                  break
                case 'gt':
                  if (key > value)
                    addToMap(tmp, key)
                  break
                case 'gte':
                  if (key >= value)
                    addToMap(tmp, key)
                  break
              }
            }
          }
        }

        const l = Object.keys(condition).length

        for (const [key, value] of tmp) {
          if (value < l)
            tmp.delete(key)
        }
      }

      for (const key of tmp.keys()) {
        mapIndex.get(key)!.forEach((id) => {
          addToMap(res, id)
        })
      }
    }

    const n = Object.keys(query.select).length
    for (const [key, value] of res) {
      if (value < n)
        res.delete(key)
    }

    if (!query.exclude) {
      if (!query.include)
        return Array.from(res.keys())

      return Array.from(res.keys())
        .filter(id => query.include!.includes(id))
    }

    return Array.from(res.keys())
      .concat(query.include || [])
      .filter(id => !query.exclude?.includes(id))
  }

  export(cb: (key: string, value: Map<string, Array<string>>) => void) {
    this.map.forEach((value, key) => {
      cb(key, value)
    })
  }
}
