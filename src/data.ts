import nsql from "node-sqlite3-wasm"

export interface Note {
    id: number,
    title: string,
    text: string,
    username: string,
}

export interface User {
    username: string,
    password: string
}

export const CreationErrors = [
    "username_exists",
    "database_failed",
] as const;

export type CreationError = typeof CreationErrors[number]

export const isCreationError = (object: unknown): object is CreationError => {
    return (typeof object === "string" && (CreationErrors as readonly string[]).indexOf(object) >= 0);
}

const db = new nsql.Database('data.db')

db.exec(`CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL
)`)

db.exec(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    text TEXT NOT NULL,
    username TEXT NOT NULL
)`)

export const getNote = async (id: number): Promise<Note | null> => {
    try {
        const result = db.get("SELECT * FROM notes WHERE id=?", [id]) as Note | null
        if (!result) {
            return null
        }
        return result
    } catch (e) {
        console.error(e)
        return null
    }
}

export const getNotes = async (username: string): Promise<Note[]> => {
    try {
        return db.all("SELECT * FROM notes WHERE username=?", [username]) as unknown as Note[]
    } catch (e) {
        console.error(e)
        return []
    }
}

export const createNote = async (title: string, text: string, username: string): Promise<Note | null> => {
    try {
        const result = db.get("INSERT INTO notes (title, text, username) VALUES (?, ?, ?) RETURNING *", [title, text, username]) as unknown as Note | null
        if (!result) {
            return null
        }
        return result
    } catch (e) {
        console.error(e)
        return null
    }
}

export const updateNote = async (id: number, title: string, text: string): Promise<Note | null> => {
    try {
        const result = db.get("UPDATE notes SET title=?, text=? WHERE id=? RETURNING *", [title, text, id]) as Note | null
        if (!result) {
            return null
        }
        return result
    } catch(e) {
        console.error(e)
        return null
    }
}

export const deleteNote = async (id: number): Promise<boolean> => {
    try {
        const result = db.run("DELETE FROM notes WHERE id=?", [id])
        return result && result.changes >= 1
    } catch (e) {
        console.error(e)
        return false
    }
}

export const getUser = async (username: string): Promise<User | null> => {
    try {
        const result = db.get("SELECT username, password FROM users WHERE username=?", [username]) as User | null
        if (!result) {
            return null
        }
        return result
    } catch (e) {
        console.error(e)
        return null
    }
}

export const createUser = async (username: string, password: string): Promise<User | CreationError> => {
    try {
        const existing = await getUser(username)
        if (existing) {
            return "username_exists"
        }

        const result = db.run("INSERT OR FAIL INTO users (username, password) VALUES (?, ?)", [username, password])
        if (result.changes > 0) {
            return {username: username, password: password}
        }
        return "database_failed"
    } catch(e) {
        if (e instanceof nsql.SQLite3Error) {
            console.error(e)
        }
        return "database_failed"
    }
}