const sqlite3 = require('sqlite3').verbose();


const getDb = () => new sqlite3.Database('./sample.db');

export type Primitive = string | number | Date | boolean;
export interface Sqlite3Query {
    query: string;
    params: Primitive[];
}

export const getRowsFromSqlite = async<T>(query: string, params: any): Promise<T[]> => {
    const db = getDb();
    const rows = await new Promise((resolve, reject) => {
        db.all(query, params, (err: Error, rows: T[]) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });

    db.close();
    return rows as T[];
}
