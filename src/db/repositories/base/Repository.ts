export interface Repository<T> {
  findOne(criteria: Partial<T>): Promise<T | null>;
  findMany(criteria: Partial<T>): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(criteria: Partial<T>, data: Partial<T>): Promise<void>;
  delete(criteria: Partial<T>): Promise<void>;
}
