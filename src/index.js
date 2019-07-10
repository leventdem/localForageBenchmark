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

let encryptedStr128
let encryptedStr256
const str = ` Sed sollicitudin, risus eget varius pulvinar, elit nisi ultricies libero, 
  nec cursus ante quam eu libero. In aliquet nibh et arcu maximus, a dictum lacus consectetur. 
  Integer condimentum odio at enim dictum tincidunt eget id nisl. Proin tincidunt tellus id ligula 
  rhoncus, in imperdiet arcu hendrerit. Donec nec metus iaculis nisi viverra tincidunt non vel massa.
  Nulla ante mi, luctus vel urna non, tempus rutrum nunc. Phasellus maximus sit amet quam quis porta.
  Suspendisse sit amet elit pulvinar, lobortis dui at, viverra sapien. Interdum et malesuada fames ac 
  ante ipsum primis in faucibus. Aliquam euismod odio non odio vestibulum porttitor. Aliquam et lorem ante.
  Integer condimentum odio at enim dictum tincidunt eget id nisl. Proin tincidunt tellus id ligula 
  rhoncus, in imperdiet arcu hendrerit. Donec nec metus iaculis nisi viverra tincidunt non vel massa.
  Nulla ante mi, luctus vel urna non, tempus rutrum nunc. Phasellus maximus sit amet quam quis porta.
  Suspendisse sit amet elit pulvinar, lobortis dui at, viverra sapien. Interdum et malesuada fames ac 
  ante ipsum primis in faucibus. Aliquam euismod odio non odio vestibulum porttitor. Aliquam et lorem ante.
  Integer condimentum odio at enim dictum tincidunt eget id nisl. Proin tincidunt tellus id ligula 
  rhoncus, in imperdiet arcu hendrerit. Donec nec metus iaculis nisi viverra tincidunt non vel massa.
  Nulla ante mi, luctus vel urna non, tempus rutrum nunc. Phasellus maximus sit amet quam quis porta.
  Suspendisse sit amet elit pulvinar, lobortis dui at, viverra sapien. Interdum et malesuada fames ac 
  ante ipsum primis in faucibus. Aliquam euismod odio non odio vestibulum porttitor. Aliquam et lorem ante.
  Integer condimentum odio at enim dictum tincidunt eget id nisl. Proin tincidunt tellus id ligula 
  rhoncus, in imperdiet arcu hendrerit. Donec nec metus iaculis nisi viverra tincidunt non vel massa.
  Nulla ante mi, luctus vel urna non, tempus rutrum nunc. Phasellus maximus sit amet quam quis porta.
  Suspendisse sit amet elit pulvinar, lobortis dui at, viverra sapien. Interdum et malesuada fames ac 
  ante ipsum primis in faucibus. Aliquam euismod odio non odio vestibulum porttitor. Aliquam et lorem ante.
  Integer condimentum odio at enim dictum tincidunt eget id nisl. Proin tincidunt tellus id ligula 
  rhoncus, in imperdiet arcu hendrerit. Donec nec metus iaculis nisi viverra tincidunt non vel massa.
  Nulla ante mi, luctus vel urna non, tempus rutrum nunc. Phasellus maximus sit amet quam quis porta.
  Suspendisse sit amet elit pulvinar, lobortis dui at, viverra sapien. Interdum et malesuada fames ac 
  ante ipsum primis in faucibus. Aliquam euismod odio non odio vestibulum porttitor. Aliquam et lorem ante.
  Integer condimentum odio at enim dictum tincidunt eget id nisl. Proin tincidunt tellus id ligula 
  rhoncus, in imperdiet arcu hendrerit. Donec nec metus iaculis nisi viverra tincidunt non vel massa.
  Nulla ante mi, luctus vel urna non, tempus rutrum nunc. Phasellus maximus sit amet quam quis porta.
  Suspendisse sit amet elit pulvinar, lobortis dui at, viverra sapien. Interdum et malesuada fames ac 
  ante ipsum primis in faucibus. Aliquam euismod odio non odio vestibulum porttitor. Aliquam et lorem ante.
  Cras blandit eget risus nec efficitur. Sed luctus placerat lorem sed convallis. Nam nec nibh nunc. `

let singleStore
let dataFile
let dataFileEnc
let app1
let app1meta
let testFile = null
let testFileLoaded = false
let nbOfKeys = 0
const nbOfIterations = 1
const AESKey = Uint8Array.from([126, 252, 235, 252, 60, 233, 252, 81, 130, 147, 61, 241, 179, 85, 95, 23])
const AESKey256 = Uint8Array.from([126, 252, 235, 252, 60, 233, 252, 81, 130, 147, 61, 241, 179, 85, 95, 23, 126, 252, 235, 252, 60, 233, 252, 81, 130, 147, 61, 241, 179, 85, 95, 23])
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
  el = document.getElementById('runEncSpeedTest')
  if (el) {
    el.addEventListener('click', e => runEncryptionSpeedTest())
  }
  el = document.getElementById('runEncSpeedTestFile')
  if (el) {
    el.addEventListener('click', e => runEncryptionSpeedTestFile())
  }
})



const loadData = () => {
  // fetch('http://192.168.26.112:8182/res/random.json')
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

const runAllTests = async () => {
  await runWriteTest(false)
  await runReadTest(false)
  await runWriteTest(true)
  await runReadTest(true)
  await runEncryptionSpeedTest(true)
}



async function runReadTest(encryption) {
  const testConf = {
    test: readSingleStore,
    resultId: `oneInstanceResultsRead${encryption ? 'WithEnc' : ''}`,
    iteration: nbOfIterations,
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
    iteration: nbOfIterations,
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
    await Promise.all(res.map(async el => {
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
    iteration: nbOfIterations,
    description: `one instance write test ${encryption ? 'WithEnc' : ''}`,
    delete: deleteSingleStore,
    encryption: encryption || false
  }

  const testConf2 = {
    test: writeDoubleStore,
    resultId: `twoInstancesResultsWrite${encryption ? 'WithEnc' : ''}`,
    iteration: nbOfIterations,
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


const runEncryptionSpeedTest = async () => {
  console.log('coucou enc speed test')

  const testConfEnc128 = {
    test: encryptionSpeed128,
    resultId: `encryptionSpeed128`,
    description: `encryptionSpeed128`,
    iteration: 1,
    encryption: true
  }
  const testConfDec128 = {
    test: decryptionSpeed128,
    resultId: `decryptionSpeed128`,
    description: `decryptionSpeed128`,
    iteration: 1,
    encryption: true
  }
  const testConfEnc256 = {
    test: encryptionSpeed256,
    resultId: `encryptionSpeed256`,
    description: `encryptionSpeed256`,
    iteration: 1,
    encryption: true
  }
  const testConfDec256 = {
    test: decryptionSpeed256,
    resultId: `decryptionSpeed256`,
    description: `decryptionSpeed256`,
    iteration: 1,
    encryption: true
  }

  // await initOperation()

  await runTest(testConfEnc128)
  await runTest(testConfDec128)

  await runTest(testConfEnc256)
  await runTest(testConfDec256)




}


const runEncryptionSpeedTestFile = async () => {

  const data = await getFile()
  dataFile = JSON.stringify(data)
  
  

  const testConfEnc128 = {
    test: encryptionSpeedFile128,
    resultId: `encryptionSpeedFile128`,
    description: `encryptionSpeedFile128`,
    iteration: 1,
    encryption: true
  }
  // const testConfDec128 = {
  //   test: decryptionSpeedFile128,
  //   resultId: `decryptionSpeedFile128`,
  //   description: `decryptionSpeedFile128`,
  //   iteration: 1,
  //   encryption: true
  // }
  const testConfEnc256 = {
    test: encryptionSpeedFile256,
    resultId: `encryptionSpeedFile256`,
    description: `encryptionSpeedFile256`,
    iteration: 1,
    encryption: true
  }
  // const testConfDec256 = {
  //   test: decryptionSpeedFile256,
  //   resultId: `decryptionSpeedFile256`,
  //   description: `decryptionSpeedFile256`,
  //   iteration: 1,
  //   encryption: true
  // }

  // await initOperation()

  await runTest(testConfEnc128)
  // await runTest(testConfDec128)

  await runTest(testConfEnc256)
  // await runTest(testConfDec256)




}


/**
 * Run a single test, and return the mean excution time.
 * @param {testConfiguration} conf - The test confuguration
 * @returns {int} - The mean execution time of the test
 */
async function runTest(conf) {
  return new Promise(async (resolve, reject) => {
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

const getFile = () => {
  return new Promise((resolve, reject) => {
    fetch('http://127.0.0.1:8182/res/random.json')
      .then((response) => response.json())
      .then(data => {
        resolve(data)
      })
  })
}





const encryptionSpeed128 = async () => {
  const cipherAES_128 = new MasqCrypto.AES({
    mode: MasqCrypto.aesModes.GCM,
    key: AESKey,
    keySize: 128
  })
  console.log(cipherAES_128)
  for (let i = 0; i < 9999; i++) {
    await cipherAES_128.encrypt(str)
  }
  encryptedStr128 = await cipherAES_128.encrypt(str)
  const dec = await cipherAES_128.decrypt(encryptedStr128)
  if (dec !== str) console.error('decryption fail')

}

const decryptionSpeed128 = async () => {
  const cipherAES_128 = new MasqCrypto.AES({
    mode: MasqCrypto.aesModes.GCM,
    key: AESKey,
    keySize: 128
  })
  console.log(cipherAES_128)
  for (let i = 0; i < 9999; i++) {
    await cipherAES_128.decrypt(encryptedStr128)
  }
  const dec = await cipherAES_128.decrypt(encryptedStr128)
  if (dec !== str) console.error('decryption fail')

}

const encryptionSpeed256 = async () => {
  const cipherAES_256 = new MasqCrypto.AES({
    mode: MasqCrypto.aesModes.GCM,
    key: AESKey256,
    keySize: 256
  })
  console.log(cipherAES_256)
  for (let i = 0; i < 9999; i++) {
    await cipherAES_256.encrypt(str)
  }
  encryptedStr256 = await cipherAES_256.encrypt(str)
  const dec = await cipherAES_256.decrypt(encryptedStr256)
  if (dec !== str) console.error('decryption fail')
}

const decryptionSpeed256 = async () => {
  const cipherAES_256 = new MasqCrypto.AES({
    mode: MasqCrypto.aesModes.GCM,
    key: AESKey256,
    keySize: 256
  })
  console.log(cipherAES_256)
  for (let i = 0; i < 9999; i++) {
    await cipherAES_256.decrypt(encryptedStr256)
  }
  const dec = await cipherAES_256.decrypt(encryptedStr256)
  if (dec !== str) console.error('decryption fail')

}


const encryptionSpeedFile128 = async () => {
  const cipherAES_128 = new MasqCrypto.AES({
    mode: MasqCrypto.aesModes.GCM,
    key: AESKey,
    keySize: 128
  })
  for (let i = 0; i < 2; i++) {
    await cipherAES_128.encrypt(dataFile)
  }
  dataFileEnc = await cipherAES_128.encrypt(dataFile)  
}

const encryptionSpeedFile256 = async () => {
  const cipherAES_256 = new MasqCrypto.AES({
    mode: MasqCrypto.aesModes.GCM,
    key: AESKey,
    keySize: 256
  })
  for (let i = 0; i < 2; i++) {
    await cipherAES_256.encrypt(dataFile)
  }
  dataFileEnc = await cipherAES_256.encrypt(dataFile)

}


// decryption cause an error, must use masq-common crypto instead of masq-crypto lib
// in decryptBuffer, we use a specific toString, we must use the data.toString() method instead
const decryptionSpeedFile128 = async () => {
  const cipherAES_128 = new MasqCrypto.AES({
    mode: MasqCrypto.aesModes.GCM,
    key: AESKey,
    keySize: 128
  })
  for (let i = 0; i < 2; i++) {
    console.log('step ',i)
    
    await cipherAES_128.decrypt(dataFileEnc)
  }
  const dec = await cipherAES_128.decrypt(dataFileEnc)
  if (dec !== str) console.error('decryption fail')

}


