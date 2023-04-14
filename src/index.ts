import * as R from 'rambda'

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

export type IndexQuery = Record<string, IndexQueryCondition[]>[]

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

  searchIndex(indexPath: string, conditions: IndexQueryCondition[]): Set<string> {
    const index = this._indexes[indexPath]
    const map = this._map.get(indexPath)

    if (!index || !map)
      return new Set()

    let ids: Set<string>

    for (const condition of conditions) {
      let tokens: string[] = []

      for (const [operation, query] of Object.entries(condition)) {
        const tmp = new Set<string>()

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
              map.get(token)!.forEach(id => tmp.add(id))
          }
          else {
            map.forEach((ids, key) => {
              if (operation === 'lt' && key < token)
                ids.forEach(id => tmp.add(id))
              else if (operation === 'lte' && key <= token)
                ids.forEach(id => tmp.add(id))
              else if (operation === 'gt' && key > token)
                ids.forEach(id => tmp.add(id))
              else if (operation === 'gte' && key >= token)
                ids.forEach(id => tmp.add(id))
            })
          }
        }
        if (!ids)
          ids = tmp
        else
          ids = intersection([ids, tmp])
      }
    }

    return ids
  }

  search(query: Record<string, IndexQueryCondition[]>[]) {
    return union(query.map(conditions =>
      intersection(Object.keys(conditions).map(indexPath =>
        this.searchIndex(indexPath, conditions[indexPath]),
      )),
    ))
  }

  export(cb: (key: string, value: Map<string, Set<string>>) => void) {
    this._map.forEach((value, key) => {
      cb(key, value)
    })
  }
}

export function query(
  query: IndexQuery,
  items: any[],
) {
  const f = R.anyPass(
    R.map((q) => {
      return R.allPass(R.map(checkRule, Object.entries(q)))
    }, query),
  )

  return R.filter(
    f,
    items,
  )
}

function checkCondition(condition: IndexQueryCondition) {
  return (value: any) => {
    if (!value)
      return false

    for (const operator of R.keys(condition)) {
      switch (operator) {
        case 'eq':
          return value === condition[operator]
        case 'gte':
          return value >= (condition[operator] as number)
        case 'gt':
          return value > (condition[operator] as number)
        case 'lte':
          return value <= (condition[operator] as number)
        case 'lt':
          return value < (condition[operator] as number)
      }
    }

    return false
  }
}

function checkRule([indexPath, conditions]: [string, IndexQueryCondition[]]) {
  if (!conditions.length)
    return R.always(true)

  return (item: any) =>
    R.anyPass(R.map(checkCondition, conditions))(
      R.path(indexPath.split('.'), item),
    )
}
