import { Index } from './dist/index.mjs'
import items from './data.json' assert { type: 'json' }

const index = new Index({
  id: 'id',
  include: ['data'],
})

profile(() => items.forEach(item => index.add(item.id, item)), 'add')
profile(() => index.search(
  {
    'data.number': [{ gte: 100, lte: 200 }, { gt: 500, lt: 1000 }], // 100-200, 501-999
    // 'data.body': [{ eq: 'hello world 821' }],
  },

), 'search')

profile(() => items.filter(item => (
  (item.data.number >= 100 && item.data.number <= 200) || (item.data.number > 500 && item.data.number < 1000)),
  // && (item.data.body === 'hello world 821'),
), 'filter')

function profile(fn, name = 'default') {
  const start = Date.now()
  const res = fn()
  const end = Date.now()

  console.group(name)
  if (res)
    console.log('- res.length:', res.length)
  console.log('- time:', end - start, 'ms')
  console.groupEnd()

  return res
}
