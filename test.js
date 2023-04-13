import { Index } from './dist/index.mjs'

const items = Array.from({ length: 1000000 }, (_, i) => ({
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

const result = profile(() => index.search([
  {
    'data.number': [{ gt: 10, lt: 1000 }],
    'data.body': [{ eq: '821' }],
  },
  {
    'data.number': [{ gt: 10, lt: 20 }],
  },
]), 'search')

profile(() => items.filter(item => (item.data.number > 10 && item.data.number < 1000 && item.data.body.includes('821')) || (item.data.number > 10 && item.data.number < 20)), 'filter')

// console.log('result', result)
// console.log('result', [...result.values()])
// console.log('index', index)

// index.export((key, value) => console.log(key, JSON.stringify(Array.from(value.keys()))))

// function profile performance of a function
async function profile(fn, name = 'default') {
  const start = Date.now()
  const res = await fn()
  const end = Date.now()

  console.group(name)
  if (res)
    console.log('- res:', res)
  console.log('- time:', `${(end - start) / 1000}s`)
  console.groupEnd()

  return res
}
