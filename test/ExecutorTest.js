import { assert } from 'chai'; 
import sinon from 'sinon';
import { Executor } from './../lib/drotto';
import os from 'os';

let instance;

describe('Executor', () => {
  afterEach(() => {
    // reset
    if (instance) {
      instance.shutdownNow(); 
      Executor.instance = undefined;
    }
  });

  describe('#constructor', () => {
    it ('should throw exception on direct instantiation', () => {
      try {
        new Executor();
        assert.fail();
      } catch (e) {
        assert.isTrue(true);
      }
    });

    it ('should throw exception on invalid _instanceKey', () => {
      try {
        new Executor(Symbol('_instanceKey'), 5);
        assert.fail();
      } catch (e) {
        assert.isTrue(true);
      }
    });

    it ('should create correct numbers of workers', () => {
      instance = Executor.fixedPool(os.cpus().length);
      assert.equal(Object.keys(instance.workers).length, os.cpus().length);
    });
  });

  describe('#fixedPool', () => {
    it ('should get Executor instance', () => {
      instance = Executor.fixedPool(2);
      assert.isTrue(instance instanceof Executor);
    });

    it ('should create a single Executor instance', () => {
      instance = Executor.fixedPool(2);
      const instance2 = Executor.fixedPool(2);
      assert.isTrue(instance === instance2);
    });

    it ('should cap pool size at cpu count', () => {
      instance = Executor.fixedPool(124421);
      assert.equal(instance.poolSize, os.cpus().length);
    });

    it ('should default to 1 worker for non number', () => {
      instance = Executor.fixedPool('foobard');
      assert.equal(instance.poolSize, 1);
    });

    it ('should store workers in object', () => {
      instance = Executor.fixedPool(124421);
      assert.equal(typeof instance.workers, "object");
    });
  });

  describe('#shutdown', () => {
    it ('should disconnect all workers', () => {
      const spy = sinon.spy();
      instance = Executor.fixedPool(os.cpus().length);

      const stub = {};
      for (let i = 0; i < os.cpus().length; i++) {
        stub[i] = { worker: { disconnect: spy } };
      }

      const pointer = instance.workers;
      instance.workers = stub;

      instance.shutdown();
      assert.equal(spy.callCount, os.cpus().length);

      instance.workers = pointer;
    });
  });

  describe('#shutdownNow', () => {
    it ('should kill all workers w/ SIGTERM', () => {
      const spy = sinon.spy();
      instance = Executor.fixedPool(os.cpus().length);

      const stub = {};
      for (let i = 0; i < os.cpus().length; i++) {
        stub[i] = { worker: { kill: spy } };
      }

      const pointer = instance.workers;
      instance.workers = stub;

      instance.shutdownNow();
      assert.equal(spy.callCount, os.cpus().length);
      assert.equal(spy.args[0][0], 'SIGTERM');

      instance.workers = pointer;
    });
  });
});