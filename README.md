# drotto

Drotto (“Dr Otto”) is a lean, NodeJS process pool, allowing for both single and multi function parallel processing.

## Installation

```shell
$ npm i --save drotto
```

## Examples

[Tutorials](https://github.com/jessecascio/drotto-tutorials)

To parallelize a single function:

```js
(async () => {
  // obtain an Executor instance
  const executor = Executor.fixedPool(os.cpus().length - 1);
  
  // cpu bound function
  const fn = (max) => {
    for (let i = 0; i < max; i++) { }
    return max;
  };

  // invoke function with param
  const p = executor.invoke(fn, [500000000]);

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