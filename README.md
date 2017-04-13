# drotto

Drotto ("Dr Otto") is a lean, NodeJS process pool, allowing for both single and multi function parallel processing.

## Why drotto?

NodeJS is single threaded.  While I/O tasks can be parallelized over the OS with it’s asynchronous architecture, CPU bound workloads block the event loop, leading to potentially disastrous performance.  To avoid this, NodeJS offers [libraries](https://nodejs.org/api/child_process.html) to parallelize CPU bound workloads over CPU cores via new processes.  Drotto is a lightweight abstraction managing creation, delegation, and deletion of parallelized NodeJS worker processes.

[More Info](http://jessesnet.com/development-notes/2017/cpu-workloads-nodejs-processor-parallelism/)

## Installation

```shell
$ npm i --save drotto
```

## Examples

**SEE [tutorials](https://github.com/jessecascio/drotto-tutorials) for more code samples**

To parallelize a single function:

```js
(async () => {
 // obtain an Executor instance
 const executor = Executor.fixedPool(os.cpus().length - 1);
  // invoke cpu bound function with param
 const p = executor.invoke(max => {
   for (let i = 0; i < max; i++) { }
   return max;
 }, [500000000]);

 // handle promise
 p.then(result => {
   console.log(`Finished ${result} iterations...`);
   executor.shutdown(); // stop processes
 }).catch(e => {
   console.log('Exception', e);
   executor.shutdown(); // stop processes
 });

 console.log('asynchronous execution...');

})();
```
To parallelize multiple functions:

```js
(async () => {
 // obtain an Executor instance
 const executor = Executor.fixedPool(os.cpus().length - 1);
  // cpu bound function
 const fn = (max) => {
   for (let i = 0; i < max; i++) { }
   return max;
 };

 try {
   console.log('Running four functions...');
  
   const promises = executor.invokeAll([fn, fn, fn, fn], [[40000000], [20000000], [60000000], [30000000]]);
   const results = await Promise.all(promises);

   console.log('Finished all iterations...', results);
 } catch (e) {
   console.log('Exception Message', e.message);
   console.log('Exception Stack Trace', e.stack);
 }

 executor.shutdown();

})();
```
