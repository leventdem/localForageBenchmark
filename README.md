# localForageBenchmark

## Usecase

We want to store, in a key-value database, an application data and the associated metadata. 
Our constraints are : 
- storing two objects : one for content and one for metadata
- both objects must be encrypted separately

## Two solutions 

### One instance 

The first solution is to have only one instance (DB) with a single object composed of two properties for a specific key.
```language-json
   key1 : {
          value : { username : 'bob' },
          meta  : { lastModfication : t1 }
          }
```

### Two instances 

The second solution is to have two instances (DB).

First instance with data content :
```language-json
   key1 : { username : 'bob' }
```
Second instance with metadata:
```language-json
   key1 : { lastModfication : t1 }
```
## Run test
```language-javascript
   npm i
   npm  start
```
In the web page, load the test file and run each test separately or click on "Run all tests". 
Results will appear directly in the page, details are shown in the console log. 

## Methodology

To measure performance we are using the function performance. The encryption is done with the AES GCM mode and a 128 bit static key. There is no additional data. 

### Write test 

We are pushing all the setItem operations and executing through a Promise.all execution. The single instance implies : 
- \# of keys setItem operations

```language-javascript
 const promiseArr = []
  for (let key of Object.keys(testFile)) {
    promiseArr.push(singleStore.setItem(key, encryption ? await cipherAES.encrypt(JSON.stringify(testFile[key])) : testFile[key]))
  }
  return Promise.all(promiseArr)
```
The double instances solution requires : 
- 2 times # of keys setItem operations 
```language-javascript
 const promiseArr = []
  for (let key of Object.keys(testFile)) {
    promiseArr.push(app1.setItem(key, encryption ? await cipherAES.encrypt(JSON.stringify(testFile[key].value)) : testFile[key].value))
    promiseArr.push(app1meta.setItem(key, encryption ? await cipherAES.encrypt(JSON.stringify(testFile[key].meta)) : testFile[key].meta))
  }
  return Promise.all(promiseArr)
  ```
  
  In both cases, the encryption adds a layer in betwwen the reception and the storing of data.
### Read test

The read operation relies on the iterate function of localforage. 
We generate an array of objects containg the key with the associated meta object : 
```language-json
[ 
   { key : { lastModification : timeStamp1} }
   { key2 : { lastModification : timeStamp1} }
   ...
]
```
For a single instance, we retrieve all the object, which means a data *overhead*, in order to get only the meta object (with lastModification property).  

```language-javascript

let res = []
await singleStore.iterate((value, key, it) => {
     res.push({
       [key]: encryption ? value : value.meta.lastModification
     })
   })
```
For two instances, only the instance with the meta information is used, a single getItem is enough to obtain the lastModification value. However with encryption, we need to process in two steps : 
1. We retrieve the encrypted value of meta data
2. We decrypt 

```language-javascript
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
```
