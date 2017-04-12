
/**
 * worker process
 */

process.on('message', (message) => {
  const fnStr = new Buffer(message.cb, 'base64').toString('ascii');
  const fn = new Function('return ' + fnStr)();

  let result;

  try {
    result = fn(...message.args);
  } catch (e) {
    return process.send({ e: { message: e.toString(), stack: e.stack } } );
  }

  process.send({ result });
});

process.on('uncaughtException', (e) => {
  process.send({ e: { message: e.toString(), stack: e.stack } } );
});

process.on('disconnect', () => {
  // possible clean up here
});
