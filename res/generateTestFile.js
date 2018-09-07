const fs = require('fs')

/**
 * Global settings : 
 * nbOfKeyValue : number of keys inside the testFile
 * e.g. 20000 => ~8MB 
 * */
const nbOfKeyValue = 20000
const fileName = 'random.json'

const genModulo10 = () => {
  return Math.round((Math.random() * 10) + 1)
}

const genModulo100k = () => {
  return Math.round((Math.random() * 100000) + 1)
}

console.log('\n *START* \n')
const content = fs.readFileSync('res/words.json')
const words = JSON.parse(content)
const keys = Object.keys(words)

const genOneDataValue = () => {
  const element = {}
  const len = (genModulo10() * 2)
  for (let index = 0; index < len; index++) {
    // 1 random array of words
    if (index === 0) {
      const arr = []
      for (let index = 0; index < (genModulo10() * 10); index++) {
        arr.push(keys[genModulo100k()])
      }
      element[keys[genModulo100k()]] = arr
    } else if (index === 1) {
      // 1 random array of  numbers
      const arr = []
      for (let index = 0; index < (genModulo10() * 10); index++) {
        arr.push(genModulo100k())
      }
      element[keys[genModulo100k()]] = arr
    } else if (index === 2) {
      // a long phrase
      const longWord = []
      for (let index = 0; index < (genModulo10() * 10); index++) {
        longWord.push(keys[genModulo100k()])
      }
      element[keys[genModulo100k()]] = longWord.join('_')
    } else {
      element[keys[genModulo100k()]] = keys[genModulo100k()]
    }
  }
  return element
}
const now = Date.now()

const storeContent = {}
for (let index = 0; index < nbOfKeyValue; index++) {
  storeContent[keys[genModulo100k()]] = {
    value: genOneDataValue(),
    meta: { lastModification: now + (60 * index) }
  }
}
console.log(`Generate ${fileName} with ${nbOfKeyValue} key-value pairs.`)

fs.writeFileSync('res/' + fileName, JSON.stringify(storeContent), 'utf8')