
import IWorker from './IWorker';

/**
 * Workers list
 */
interface IWorkers {
  [pid: string]: IWorker;
}

export default IWorkers;
