import localforage from 'localforage'
import MasqCrypto from 'masq-crypto'

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
const AESKey = Uint8Array.from([126, 252, 235, 252, 60, 233, 252, 81, 130, 147, 61, 241, 179, 85, 95, 23])
const cipherAES = new MasqCrypto.AES({
  mode: MasqCrypto.aesModes.GCM,
  key: AESKey,
  keySize: 128
})
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
  el = document.getElementById('runWriteTestWithEnc')
  if (el) {
    el.addEventListener('click', e => runWriteTest(true))
  }
  el = document.getElementById('runReadTestWithEnc')
  if (el) {
    el.addEventListener('click', e => runReadTest(true))
  }
  el = document.getElementById('loadData')
  if (el) {
    el.addEventListener('click', e => loadData())
  }
  el = document.getElementById('runAllTests')
  if (el) {
    el.addEventListener('click', e => runAllTests())
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

const runAllTests = async() => {
  await runWriteTest(false)
  await runReadTest(false)
  await runWriteTest(true)
  await runReadTest(true)
}

async function runReadTest(encryption) {
  const testConf = {
    test: readSingleStore,
    resultId: `oneInstanceResultsRead${encryption ? 'WithEnc' : ''}`,
    iteration: 2,
    description: `one instance read test ${encryption ? 'WithEnc' : ''}`,
    encryption: encryption || false
  }
  let testResult = await runTest(testConf)
  let timeStamps = testResult.res
  if (timeStamps.length !== nbOfKeys) {
    console.log(`Error : read keys # is ${timeStamps.length} instead of ${nbOfKeys}`)
  } else {
    console.log('# of keys : ', timeStamps.length)
  }
  const testConf2 = {
    test: readDoubleStore,
    resultId: `twoInstancesResultsRead${encryption ? 'WithEnc' : ''}`,
    iteration: 2,
    description: `two instances read test ${encryption ? 'WithEnc' : ''}`,
    encryption: encryption || false
  }
  testResult = await runTest(testConf2)
  timeStamps = testResult.res
  if (timeStamps.length !== nbOfKeys) {
    console.log(`Error : read keys # is ${timeStamps.length} instead of ${nbOfKeys}`)
  } else {
    console.log('# of keys : ', timeStamps.length)
  }
}

const readSingleStore = async encryption => {
  let res = []
  let dec = []
  await singleStore.iterate((value, key, it) => {
      res.push({
        [key]: encryption ? value : value.meta.lastModification
      })
    })
    /**
     * res contains : [
     * {a:{ciphertext:"efef",iv:"",additionalData:""}},
     * {b:{ciphertext:"efef",iv:"",additionalData:""}},
     * ]
     */

  if (encryption) {
    await Promise.all(res.map(async(el) => {
      let val = JSON.parse(await cipherAES.decrypt(Object.values(el)[0]))
      dec.push(val.meta.lastModification)
    }))
  }
  return encryption ? dec : res
}

const readDoubleStore = async encryption => {
  let res = []
  let dec = []
  await app1meta.iterate((value, key, it) => {
    res.push({
      [key]: encryption ? value : value.lastModification
    })
  })
  if (encryption) {
    await Promise.all(res.map(async el => {
      let val = JSON.parse(await cipherAES.decrypt(Object.values(el)[0]))
      dec.push(val.lastModification)
    }))
  }
  return encryption ? dec : res
}

const runWriteTest = async encryption => {
  await deleteSingleStore()
  await deleteDoubleStore()
  const testConf = {
    test: writeSingleStore,
    resultId: `oneInstanceResultsWrite${encryption ? 'WithEnc' : ''}`,
    iteration: 2,
    description: `one instance write test ${encryption ? 'WithEnc' : ''}`,
    delete: deleteSingleStore,
    encryption: encryption || false
  }

  const testConf2 = {
    test: writeDoubleStore,
    resultId: `twoInstancesResultsWrite${encryption ? 'WithEnc' : ''}`,
    iteration: 2,
    description: `Two instances write test ${encryption ? 'WithEnc' : ''}`,
    delete: deleteDoubleStore,
    encryption: encryption || false
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
    let res = {}
    console.log(`start...${conf.description}`)
    if (!testFileLoaded) {
      console.log('Please load the test file before running the test ')
    }
    const results = []
    let el = document.getElementById(conf.resultId)
    el.innerHTML = 'wait ... results will be shown here.'
    let t0, t1
    for (let index = 0; index < conf.iteration; index++) {
      t0 = performance.now()
      try {
        console.log('index', index)
        res.res = await conf.test(conf.encryption || false)
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
    res.meanTIme = mean
    el.innerHTML = `${conf.description} : for ${conf.iteration} iterations, the mean time is : ${mean}ms`
    resolve(res)
  })
}

const writeSingleStore = async encryption => {
  const promiseArr = []
  for (let key of Object.keys(testFile)) {
    promiseArr.push(singleStore.setItem(key, encryption ? await cipherAES.encrypt(JSON.stringify(testFile[key])) : testFile[key]))
  }
  return Promise.all(promiseArr)
}

const deleteSingleStore = () => {
  return singleStore.clear()
}

const writeDoubleStore = async encryption => {
  const promiseArr = []
  for (let key of Object.keys(testFile)) {
    promiseArr.push(app1.setItem(key, encryption ? await cipherAES.encrypt(JSON.stringify(testFile[key].value)) : testFile[key].value))
    promiseArr.push(app1meta.setItem(key, encryption ? await cipherAES.encrypt(JSON.stringify(testFile[key].meta)) : testFile[key].meta))
  }
  return Promise.all(promiseArr)
}

async function deleteDoubleStore() {
  await app1.clear()
  await app1meta.clear()
}