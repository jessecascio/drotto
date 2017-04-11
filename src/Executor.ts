
import * as proc from 'child_process';
import * as os from 'os';
import IWorker from './IWorker';

// lock instantiation with key
const _instanceKey = Symbol('_instanceKey');

/**
 * worker pool singleton
 */
export default class Executor {
  /**
   * array of current workers
   */
  private workers: IWorker[] = [];

  /**
   * singleton instance
   */
  private static instance: Executor;
 
  /**
   * prevent direct instantiation, create workers
   * @param key - required for instantiation
   * @param poolSize - number
   * @throws Error
   */
  private constructor(key: symbol, poolSize: any) {
    if (key !== _instanceKey) {
      throw new Error('No Direct Instantiation');
    }

    let cleanSize = parseInt(poolSize, 10); // expects string

    // ensure valid range
    if (typeof cleanSize !== 'number' || cleanSize < 1) {
      cleanSize = 1;
    } else if (cleanSize > os.cpus().length) {
      cleanSize = os.cpus().length;
    }

    for (let i = 0; i < cleanSize; i++) {
      const worker = proc.fork(`${__dirname}/proc/process`);
      this.workers[worker.pid] = { active: false, worker };
    }
  }

  /**
   * get an Executor instance
   * @param poolSize - number of processes
   */
  public static fixedPool(poolSize: number): Executor {
    // forced singleton
    if (Executor.instance) {
      return Executor.instance;
    }

    Executor.instance = new Executor(_instanceKey, poolSize);
    return Executor.instance;
  }

  /**
   * kill processes after current work has finished
   */
  public shutdown() {
    for (const pid in this.workers) {
      this.workers[pid].worker.disconnect();
    }
  }

  /**
   * kill processes immediately
   */
  public shutdownNow() {
    for (const pid in this.workers) {
      this.workers[pid].worker.kill('SIGTERM');
    }
  }

  /**
   * invoke an array of functions
   * @param cbs - array of functions
   * @param args - array of function args
   * @return array of Promises
   */
  public invokeAll(cbs: Function[],  args: any[] = []): Promise<any>[] {
    const ps = [];

    cbs.forEach((v, k) => {
      ps.push(this.invoke(v, args[k]));
    });

    return ps;
  }

  /**
   * invoke a function with args in a process
   * @param cb
   * @param args
   * @return Promise
   */
  public invoke(cb: Function, args?: any[]): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let worker;

      try {
        worker = await this._pollWorkers();
      } catch (e) {
        return reject(e);
      }

      // removable event handlers
      const mHandler = (d, e) => {
        this.workers[worker.pid].active = false;
        this.workers[worker.pid].worker.removeListener('message', mHandler);

        if (e || d.e) {
          return d.e ? reject(d.e) : reject(e);
        }

        return resolve(d.result);
      };

      const eHandler = (e) => {
        this.workers[worker.pid].active = false;
        this.workers[worker.pid].worker.removeListener('error', eHandler);
        return reject(e);
      };

      worker.on('message', mHandler);
      worker.on('error', eHandler);

      // kick off work
      worker.send({ cb: new Buffer(cb.toString()).toString('base64'), args });
    });
  }

  /**
   * poll workers, non-blocking
   * @return Promise
   */
  private _pollWorkers(): Promise<IWorker> {
    return new Promise((resolve, reject) => {
      // wont block the event loop
      let interval = setInterval(() => {
        let worker = false;

        Object.keys(this.workers).some((pid) => {
          if (this.workers[pid].active === false) {
            this.workers[pid].active = true;
            worker = this.workers[pid].worker;
            return true; // breaks loop
          }
        });

        if (worker !== false) {
          clearInterval(interval);
          return resolve(worker);
        }
      }, 0);
    });
  }
}
