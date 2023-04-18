import * as R from 'rambda'

import { get } from './utils'

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

  search(query: Record<string, IndexQueryCondition[]>): Array<string> {
    // const result: Set<string> = new Set()

    const tmp = new Map<string, number>()
    const addTmp = (key: string) => {
      if (tmp.has(key))
        tmp.set(key, tmp.get(key) + 1)
      else
        tmp.set(key, 1)
    }

    for (const [indexPath, conditions] of Object.entries(query)) {
      // const resultTmp = new Map<string, number>()

      const index = this._indexes[indexPath]
      const map = this._map.get(indexPath)

      if (!index || !map)
        return []

      // const ids: Set<string> = new Set()

      for (const condition of conditions) {
        let tokens: string[] = []

        for (const [operation, operationQuery] of Object.entries(condition)) {
          switch (index.type) {
            case 'string':
              tokens = tokenizeMap[this._indexes[indexPath].tokenize](operationQuery)
              break
            case 'number':
              tokens = [operationQuery]
          }

          for (const token of tokens) {
            if (operation === 'eq') {
              if (map.has(token))
                addTmp(token)
            }
            else {
              map.forEach((ids, key) => {
                if (operation === 'lt' && key < token)
                  addTmp(ids)
                else if (operation === 'lte' && key <= token)
                  addTmp(ids)
                else if (operation === 'gt' && key
                > token)
                  addTmp(ids)
                else if (operation === 'gte' && key >= token)
                  addTmp(ids)
              })
            }
          }
        }

        const l = Object.keys(condition).length
        // console.log('tmp', map.size)

        tmp.forEach((value, key) => {
          if (value < l) {
            tmp.delete(key)
            return
          }

          tmp.set(key, 666)
        })
      }

      // return ids
    }

    return Array.from(tmp.keys())
  }

  // search(query: Record<string, IndexQueryCondition[]>[]) {
  //   return union(query.map(conditions =>
  //     intersection(Object.keys(conditions).map((indexPath) => {
  //       return this.searchIndex(indexPath, conditions[indexPath])
  //     },
  //     )),
  //   ))
  // }

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
