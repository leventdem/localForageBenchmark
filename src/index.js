import localforage from 'localforage'

/**
 @typedef testConfiguration
 @type {Object}
 @property {Promise} test - The test function (must take the testFile as input)
 @property {Promise} delete - The deletion function
 @property {int} iteration - The # of test execution
 @property {string} resultId - The div id of the results
 @property {string} description - A simple test description
 */

let singleStore
let app1
let app1meta
let testFile = null
let testFileLoaded = false
let nbOfKeys = 0

singleStore = localforage.createInstance({
  name: 'singleStore'
})
app1 = localforage.createInstance({
  name: 'app1'
})
app1meta = localforage.createInstance({
  name: 'app1meta'
})

document.addEventListener('DOMContentLoaded', () => {
  let el = null
  el = document.getElementById('runWriteTest')
  if (el) {
    el.addEventListener('click', e => runWriteTest())
  }
  el = document.getElementById('runReadTest')
  if (el) {
    el.addEventListener('click', e => runReadTest())
  }
  el = document.getElementById('loadData')
  if (el) {
    el.addEventListener('click', e => loadData())
  }
})

const loadData = () => {
  fetch('http://127.0.0.1:8182/res/random.json')
    .then((response) => response.json())
    .then(data => {
      testFile = data
      testFileLoaded = true
      nbOfKeys = Object.keys(testFile).length
      console.log('File loaded, # of keys : ', nbOfKeys)
    })
    .catch((err) => console.log(err))
}

async function runReadTest() {
  const testConf = {
    test: readSingleStore,
    resultId: 'oneInstanceResultsRead',
    iteration: 2,
    description: 'one instance read test'
  }
  const timeStamps = await runTest(testConf)
  if (timeStamps.length !== nbOfKeys) {
    console.log(`Error : read keys # is ${timeStamps.length} instead of ${nbOfKeys}`)
  } else {
    console.log('# of keys : ', timeStamps.length)
  }
  const testConf2 = {
    test: readDoubleStore,
    resultId: 'twoInstancesResultsRead',
    iteration: 2,
    description: 'two instances read test'
  }
  const timeStamps2 = await runTest(testConf2)
  if (timeStamps2.length !== nbOfKeys) {
    console.log(`Error : read keys # is ${timeStamps2.length} instead of ${nbOfKeys}`)
  } else {
    console.log('# of keys : ', timeStamps2.length)
  }
}

async function readSingleStore() {
  await writeSingleStore(testFile)
  let res = []
  await singleStore.iterate((value, key, it) => {
    res.push({
      [key]: value.meta.lastModification
    })
  })
  return res
}

async function readDoubleStore() {
  await writeDoubleStore(testFile)
  let res = []
  await app1meta.iterate((value, key, it) => {
    res.push({
      [key]: value.lastModification
    })
  })
  return res
}

async function runWriteTest() {
  const testConf = {
    test: writeSingleStore,
    resultId: 'oneInstanceResults',
    iteration: 2,
    description: 'one instance write test',
    delete: deleteSingleStore
  }

  const testConf2 = {
    test: writeDoubleStore,
    resultId: 'twoInstancesResults',
    iteration: 2,
    description: 'Two instances write test ',
    delete: deleteDoubleStore
  }
  await runTest(testConf)
  let keys = await singleStore.keys()
  if (keys.length !== nbOfKeys) {
    console.log(`Error : written keys # is ${keys.length} instead of ${nbOfKeys}`)
  } else {
    console.log(`Write succesfully ${keys.length} elements.`)
  }
  await runTest(testConf2)
  keys = await app1meta.keys()
  if (keys.length !== nbOfKeys) {
    console.log(`Error : written keys # is ${keys.length} instead of ${nbOfKeys}`)
  } else {
    console.log(`Write succesfully ${keys.length} elements.`)
  }
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
        if (conf.delete && index !== (conf.iteration - 1)) {
          await conf.delete()
          console.log('delete store')
        }
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

const writeSingleStore = (data) => {
  const promiseArr = []
  for (let key of Object.keys(data)) {
    promiseArr.push(singleStore.setItem(key, data[key]))
  }
  return Promise.all(promiseArr)
}

const deleteSingleStore = () => {
  return singleStore.clear()
}

const writeDoubleStore = (data) => {
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