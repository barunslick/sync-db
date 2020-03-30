import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';

/**
 * Create a temporary directory and return it's path.
 *
 * @returns {Promise<string>}
 */
export function mkdtemp() {
  return promisify(fs.mkdtemp)(`${os.tmpdir()}${path.sep}`);
}

/**
 * Read file contents.
 *
 * @param {string} filename
 * @returns {Promise<string>}
 */
export function read(filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if (err) {
        return reject(err);
      }

      resolve(data.toString());
    });
  });
}

/**
 * Check if the file exists.
 *
 * @param {string} filename
 * @returns {Promise<boolean>}
 */
export function exists(filename: string): Promise<boolean> {
  return new Promise(resolve => {
    fs.access(filename, fs.constants.F_OK, err => resolve(!err));
  });
}

/**
 * Read all files in a directory.
 *
 * @param {string} pathName
 * @returns {Promise<string[]>}
 */
export function glob(pathName: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    fs.readdir(pathName, (err, data) => {
      if (err) {
        return reject(err);
      }

      resolve(data);
    });
  });
}

/**
 * Write contents to file.
 *
 * @param {string} filepath
 * @param {any} data
 * @returns {Promise<void>}
 */
export function write(filepath: string, data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, data, err => {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });
}

/**
 * Remove the file.
 *
 * @param {string} filepath
 * @returns {Promise<void>}
 */
export function remove(filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.unlink(filepath, err => {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });
}
