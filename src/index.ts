import { get, intersection, union } from './utils'

interface IndexOptions {
  document: {
    id: string
    indexes: IndexOptionsIndexes
  }
}

type IndexOptionsIndexes = Record<string, {
  tokenize: 'strict' | 'full' | 'none'
  type: 'string' | 'number'
}>

export type IndexQueryOperator =
  | 'eq'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'

export type IndexQueryCondition = Partial<Record<IndexQueryOperator, any>>

const tokenizeMap = {
  strict: (value: string) => [value],
  words: (value: string) => value.split(' '),
  none: (value: string) => [value],
}

export class Index {
  private _map: Map<string, Map<string, Set<string>>>
  private _indexes: IndexOptionsIndexes

  constructor(options: IndexOptions) {
    this._indexes = options.document.indexes
    this._map = new Map(Object.keys(options.document.indexes).map((indexPath) => {
      return [indexPath, new Map()]
    }))
  }

  add(id: string, document: Record<string, any>) {
    Object.entries(this._indexes).forEach(([indexPath, index]) => {
      let tokens: string[] = []
      const tokenize = tokenizeMap[index.tokenize]
      const value = get(document, indexPath)

      if (value === undefined)
        return

      switch (index.type) {
        case 'string':
          tokens = tokenize(value)
          break
        case 'number':
          tokens = [value]
      }

      const map = this._map.get(indexPath)

      if (map) {
        tokens.forEach((token) => {
          if (!map.has(token))
            map.set(token, new Set())

          map.get(token)!.add(id)
        })
      }
    })
  }

  searchIndex(indexPath: string, operation: IndexQueryOperator, query: string): Set<string> {
    const index = this._indexes[indexPath]
    const map = this._map.get(indexPath)
    if (!index || !map)
      return new Set()

    let tokens: string[] = []
    const ids: Set<string> = new Set()

    switch (index.type) {
      case 'string':
        tokens = tokenizeMap[this._indexes[indexPath].tokenize](query)
        break
      case 'number':
        tokens = [query]
    }

    for (const token of tokens) {
      if (operation === 'eq') {
        if (map.has(token))
          return map.get(token)!
        else
          return new Set()
      }

      for (const [key, value] of map.entries()) {
        switch (operation) {
          case 'lt':
            if (key < token) {
              for (const id of value)
                ids.add(id)
            }
            break
          case 'lte':
            if (key <= token) {
              for (const id of value)
                ids.add(id)
            }
            break
          case 'gt':
            if (key > token) {
              for (const id of value)
                ids.add(id)
            }

            break
          case 'gte':
            if (key >= token) {
              for (const id of value)
                ids.add(id)
            }
            break
        }
      }
    }

    return ids
  }

  search(query: Record<string, IndexQueryCondition[]>[]) {
    return union(query.map(conditions =>
      intersection(Object.keys(conditions).map(indexPath =>
        union(conditions[indexPath].map(condition =>
          intersection(Object.keys(condition).map(operation =>
            this.searchIndex(indexPath, operation as IndexQueryOperator, condition[operation]),
          )),
        )),
      )),
    ))
  }

  export(cb: (key: string, value: Map<string, Set<string>>) => void) {
    this._map.forEach((value, key) => {
      cb(key, value)
    })
  }
}
