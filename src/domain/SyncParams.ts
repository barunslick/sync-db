import ExecutionContext from './ExecutionContext';

/**
 * Synchronize parameters.
 */
interface SynchronizeParams {
  force: boolean;
  onSuccess: (context: ExecutionContext) => Promise<any>;
  onFailed: (context: ExecutionContext) => Promise<any>;
}

export default SynchronizeParams;
