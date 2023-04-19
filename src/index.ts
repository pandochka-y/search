import { flattenObject, mapAdd } from './utils'

interface IndexOptions {
  id: string
  include?: string[]
  exclude?: string[]
}

export type IndexQuery = Record<string, IndexQueryCondition[]>[]
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

  search(query: Record<string, IndexQueryCondition[]>): Array<string> {
    const res = new Map<string, number>()

    for (const [indexPath, conditions] of Object.entries(query)) {
      const map = this.map.get(indexPath)

      if (!map)
        return []

      const tmp = new Map<string, number>()
      for (const condition of conditions) {
        for (const [operation, value] of Object.entries(condition)) {
          if (operation === 'eq') {
            if (map.has(value))
              mapAdd(tmp, value)
          }
          else {
            [...map.keys()].forEach((key) => {
              switch (operation) {
                case 'lt':
                  if (key < value)
                    mapAdd(tmp, key)
                  return
                case 'lte':
                  if (key <= value)
                    mapAdd(tmp, key)
                  return
                case 'gt':
                  if (key > value)
                    mapAdd(tmp, key)
                  return
                case 'gte':
                  if (key >= value)
                    mapAdd(tmp, key)
              }
            })
          }
        }

        const l = Object.keys(condition).length

        tmp.forEach((value, key) => {
          if (value < l)
            tmp.delete(key)
        })
      }

      tmp.forEach((value, key) => {
        map.get(key)!.forEach((id) => {
          mapAdd(res, id)
        })
      })
    }

    const l = Object.keys(query).length
    res.forEach((value, key) => {
      if (value < l)
        res.delete(key)
    })

    return Array.from(res.keys())
  }

  export(cb: (key: string, value: Map<string, Array<string>>) => void) {
    this.map.forEach((value, key) => {
      cb(key, value)
    })
  }
}
