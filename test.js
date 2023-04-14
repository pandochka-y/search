import { Index, query } from './dist/index.mjs'

const items = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  data: {
    body: `hello world ${i}`,
    number: Math.floor(Math.random() * 1000),
  },
}))

const index = new Index({
  document: {
    id: 'id',
    indexes: {
      'data.body': {
        type: 'string',
        tokenize: 'words',
      },
      'data.number': {
        type: 'number',
        tokenize: 'words',
      },
    },
  },
})

profile(() => items.forEach(item => index.add(item.id, item)), 'add')

profile(() => index.search([
  {
    'data.number': [{ gte: 100, lte: 200 }],
    // 'data.body': [{ eq: '821' }],
  },
  {
    'data.number': [{ gt: 500, lt: 1000 }],
  },
]), 'search')

profile(() => items.filter(item => ((item.data.number >= 100 && item.data.number <= 200) || (item.data.number > 500 && item.data.number < 1000))), 'filter')

profile(() => query([
  {
    'data.number': [{ gte: 100, lte: 200 }],
    // 'data.body': [{ eq: 'hello world 821' }],
  },
  {
    'data.number': [{ gt: 500, lt: 1000 }],
  },
], items), 'query')

// console.log('result', result)
// console.log('result', [...result.values()])
// console.log('index', index)

// index.export((key, value) => console.log(key, JSON.stringify(Array.from(value.keys()))))

// function profile performance of a function
function profile(fn, name = 'default') {
  const start = Date.now()
  const res = fn()
  const end = Date.now()

  console.group(name)
  if (res)
    console.log('- res.length:', res.length ? res.length : res.size)
  console.log('- time:', `${(end - start) / 1000}s`)
  console.groupEnd()

  return res
}
