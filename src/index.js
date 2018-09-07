import localforage from 'localforage'

let singleStore
let app1
let app1meta
let testFile = null

singleStore = localforage.createInstance({
  name: 'singleStore'
})
app1 = localforage.createInstance({
  name: 'app1'
})
app1meta = localforage.createInstance({
  name: 'app1meta'
})

document.addEventListener('DOMContentLoaded', function() {
  var el = null
  el = document.getElementById('runSingleStoreTest')
  if (el) {
    el.addEventListener('click', function(e) {
      runSingleStoreTest()
    })
  }
  el = document.getElementById('deleteSingleStore')
  if (el) {
    el.addEventListener('click', function(e) {
      deleteSingleStore()
    })
  }
  el = document.getElementById('runDoubleStoreTest')
  if (el) {
    el.addEventListener('click', function(e) {
      runDoubleStoreTest()
    })
  }
  el = document.getElementById('deleteDoubleStore')
  if (el) {
    el.addEventListener('click', function(e) {
      deleteDoubleStore()
    })
  }
  el = document.getElementById('loadData')
  if (el) {
    el.addEventListener('click', function(e) {
      loadData()
    })
  }
})

const loadData = () => {
  fetch('http://127.0.0.1:8182/res/random.json')
    .then((response) => response.json())
    .then(data => {
      testFile = data
      console.log('File loaded')
    })
    .catch((err) => console.log(err))
}

async function runSingleStoreTest() {
  console.log('start...')
  const iterations = 5
  const results = []
  let el = document.getElementById('oneInstanceResults')
  let t0, t1
  for (let index = 0; index < iterations; index++) {
    t0 = performance.now()
    try {
      console.log('index', index)
      await fillSingleStorage(testFile)
      t1 = performance.now()
      console.log('Call to singleStore took ' + (t1 - t0) + ' milliseconds.')
      results.push(parseInt(t1) - parseInt(t0))
      await deleteSingleStore()
      console.log('delete store')
      el.innerHTML = results.toString()
    } catch (error) {
      console.log(error)
    }
  }
  let acc = 0
  results.forEach(time => {
    acc = time + acc
  })
  let mean = acc / iterations
  el.innerHTML = `One instance test : for ${iterations} iterations, the mean time is : ${mean}ms`
  runDoubleStoreTest()
}

const fillSingleStorage = (data) => {
  const promiseArr = []
  for (let key of Object.keys(data)) {
    promiseArr.push(singleStore.setItem(key, data[key]))
  }
  return Promise.all(promiseArr)
}

const deleteSingleStore = () => {
  return singleStore.clear()
}

async function runDoubleStoreTest() {
  console.log('Run double instances test')
  console.log('start...')
  const iterations = 5
  const results = []
  let el = document.getElementById('twoInstancesResults')
  let t0, t1
  for (let index = 0; index < iterations; index++) {
    try {
      t0 = performance.now()
      await fillDoubleStorage(testFile)
      t1 = performance.now()
      console.log('Call to doubleStorage took ' + (t1 - t0) + ' milliseconds.')
      results.push(parseInt(t1) - parseInt(t0))
      await deleteDoubleStore()
      console.log('delete stores')
      el.innerHTML = results.toString()
    } catch (error) {
      console.log(error)
    }
  }
  let acc = 0
  results.forEach(time => {
    acc = time + acc
  })
  let mean = acc / iterations
  el.innerHTML = `Two instances test : for ${iterations} iterations, the mean time is : ${mean}ms`
}

const fillDoubleStorage = (data) => {
  const promiseArr = []
  for (let key of Object.keys(data)) {
    promiseArr.push(app1.setItem(key, data[key].value))
    promiseArr.push(app1meta.setItem(key, data[key].meta))
  }
  return Promise.all(promiseArr)
}

async function deleteDoubleStore() {
  await app1.clear()
  await app1meta.clear()
}

// Setting the key on one of these doesn't affect the other.
// let res = {}
// store.setItem('name', 'bob')
//   .then(() => store.setItem('age', '40'))
//   .then(() => {
//     return iter()
//   })
//   // .then(() => store.iterate((value, key, it) => {
//   //   // console.log([key, value])
//   //   res[key] = value
//   // }))
//   .then((r) => {
//     console.log('iteration is complete')
//     console.log(r)
//   })
// otherStore.setItem('name', 'alice').then(() => console.log('done'))

// function iter () {
//   let res = {}
//   return store.iterate((value, key, it) => {
//     res[key] = value
//   }).then(() => {
//     return res
//   })
// }
// async function iter () {
//   let res = {}
//   await store.iterate((value, key, it) => {
//     res[key] = value
//   })
//   return res
// }