import { SQL, and, eq } from "drizzle-orm";
import { SQLiteTable, TableConfig } from "drizzle-orm/sqlite-core";
import { db } from "../..";
import logger from "../../../utils/logger";

type WhereCondition = SQL<unknown>;

export abstract class BaseRepository<
  T extends Record<string, any>,
  TTable extends SQLiteTable<TableConfig> & { id: any },
> {
  protected constructor(
    protected readonly table: TTable,
    protected readonly columns: (keyof T)[]
  ) {}

  protected createConditions(criteria: Partial<T>): WhereCondition[] {
    const conditions: WhereCondition[] = [];

    for (const column of this.columns) {
      if (column in criteria && criteria[column] !== undefined) {
        conditions.push(
          eq(this.table[column as keyof TTable] as any, criteria[column])
        );
      }
    }

    return conditions;
  }

  async findOne(criteria: Partial<T>): Promise<T | null> {
    try {
      const conditions = this.createConditions(criteria);

      const results = await db
        .select()
        .from(this.table)
        .where(and(...conditions))
        .limit(1);

      return (results[0] as T) || null;
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.findOne:`, error);
      throw error;
    }
  }

  async findMany(criteria: Partial<T>): Promise<T[]> {
    try {
      const conditions = this.createConditions(criteria);

      const results = await db
        .select()
        .from(this.table)
        .where(and(...conditions));

      return results as T[];
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.findMany:`, error);
      throw error;
    }
  }

  async create(data: Partial<T>): Promise<T> {
    try {
      const results = await db
        .insert(this.table)
        .values(data as any)
        .returning();

      return results[0] as T;
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.create:`, error);
      throw error;
    }
  }

  async update(criteria: Partial<T>, data: Partial<T>): Promise<void> {
    try {
      const conditions = this.createConditions(criteria);

      await db
        .update(this.table)
        .set(data as any)
        .where(and(...conditions));
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.update:`, error);
      throw error;
    }
  }

  async delete(criteria: Partial<T>): Promise<void> {
    try {
      const conditions = this.createConditions(criteria);

      await db.delete(this.table).where(and(...conditions));
    } catch (error) {
      logger.error(`Error in ${this.constructor.name}.delete:`, error);
      throw error;
    }
  }
}
