# localForageBenchmark

## Usecase

We want to store in a key-value database an application data and the associated metadata. 
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
   npm run start
```
