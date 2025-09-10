import { IdGenerator } from '../domain/ports.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * UUID-based ID generator for repositories.
 */
export class UuidIdGenerator implements IdGenerator {
  generateId(prefix: string): string {
    return `${prefix}_${uuidv4()}`;
  }
}



