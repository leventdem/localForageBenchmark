import localforage from 'localforage'

/**
 @typedef testConfiguration
 @type {Object}
 @property {Promise} test - The test function (must take the testFile as input)
 @property {int} iteration - The # of test execution
 @property {string} resultId - The div id of the results
 @property {string} description - A simple test description
 */

let singleStore
let app1
let app1meta
let testFile = null
let testFileLoaded = false

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
  el = document.getElementById('runWriteTest')
  if (el) {
    el.addEventListener('click', function(e) {
      runWriteTest()
    })
  }
  el = document.getElementById('deleteStores')
  if (el) {
    el.addEventListener('click', function(e) {
      deleteSingleStore()
        .then(() => deleteDoubleStore())
    })
  }
  el = document.getElementById('runReadTest')
  if (el) {
    el.addEventListener('click', function(e) {
      runReadTest()
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
      testFileLoaded = true
      console.log('File loaded')
    })
    .catch((err) => console.log(err))
}

async function runReadTest() {

}

async function runWriteTest() {
  const testConf = {
    test: fillSingleStorage,
    resultId: 'oneInstanceResults',
    iteration: 2,
    description: 'one instance write test '
  }

  const testConf2 = {
    test: fillDoubleStorage,
    resultId: 'twoInstancesResults',
    iteration: 2,
    description: 'Two instances write test '
  }
  const res = await runTest(testConf)
  console.log('fin', res)
  const res2 = await runTest(testConf2)
  console.log('fin2', res2)


}

/**
 * Run a single test, and return the mean excution time.
 * @param {testConfiguration} conf - The test confuguration
 * @returns {int} - The mean execution time of the test
 */
async function runTest(conf) {
  return new Promise(async(resolve, reject) => {
    console.log(`start...${conf.description}`)
    if (!testFileLoaded) {
      console.log('Please load the test file before running the test ')
    }
    const results = []
    let el = document.getElementById(conf.resultId)
    let t0, t1
    for (let index = 0; index < conf.iteration; index++) {
      t0 = performance.now()
      try {
        console.log('index', index)
        await conf.test(testFile)
        t1 = performance.now()
        console.log('Call took ' + (t1 - t0) + ' milliseconds.')
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
    let mean = acc / conf.iteration
    el.innerHTML = `${conf.description} : for ${conf.iteration} iterations, the mean time is : ${mean}ms`
    resolve(mean)
  })
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