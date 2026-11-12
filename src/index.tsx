import {serve} from '@hono/node-server'
import type {Context} from 'hono'
import {Hono} from 'hono'
import {type SessionEnv, useSession} from "@hono/session"
import {createMiddleware} from 'hono/factory'
import {
    createNote,
    createUser,
    type CreationError,
    deleteNote,
    getNote,
    getUser,
    isCreationError,
    type Note,
    updateNote,
    type User
} from "./data.js"
import {HomePage, LoginPage, NoPermissionPage, NotePage, NotFoundPage, RegisterPage} from "./components.js";
import {getConnInfo} from "@hono/node-server/conninfo";

type AppSessionData = {
    username: string
}

type AppEnv = SessionEnv<AppSessionData> & {
    Variables: {
        user: User
    }
}

const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
    const session = await c.var.session.get()
    const username = session?.username
    if (!username) {
        return c.redirect("/login")
    }
    const user = await getUser(username)
    if (!user) {
        c.var.session.delete()
        return c.redirect("/login")
    }
    c.set("user", user)
    await next()
})

const app = new Hono<AppEnv>()
    .use(useSession<AppSessionData>({
        secret: "lol",
        duration: {absolute: 3600}
    }))

const parseCredentials = async (c: Context) => {
    const form = await c.req.formData()
    const username = form.get("username")?.toString()
    const password = form.get("password")?.toString()
    if (!username || !password) return null
    return {username, password}
}

const canAccess = (user: User, note: Note | null): boolean => {

    // VULNERABILITY A01:
    // if (note && note.username !== user.username) {
    //    return false
    // }

    return true
}

app.get('/', authMiddleware, (c) => c.html(<HomePage user={c.var.user}/>))

app.get('/note/:id', authMiddleware, async (c) => {
    const note = await getNote(Number(c.req.param('id')))

    // VULNERABILITY A10:
    // if (!note) {
    //    return c.html(<NotFoundPage/>)
    // }

    if (!canAccess(c.var.user, note)) {
        return c.html(<NoPermissionPage/>)
    }
    return c.html(<NotePage note={note}/>)
})

app.get('/note/:id/edit', authMiddleware, async (c) => {
    const note = await getNote(Number(c.req.param('id')))
    if (!note) {
        return c.html(<NotFoundPage/>)
    }
    if (!canAccess(c.var.user, note)) {
        return c.html(<NoPermissionPage/>)
    }
    return c.html(<NotePage note={note} edit/>)
})

app.post('/note', authMiddleware, async (c) => {
    const form = await c.req.formData()
    const title = form.get("title")?.toString()
    if (!title) return c.status(400)

    const note = await createNote(title, "", c.var.user.username)
    if (!note) return c.status(500)

    return c.redirect(`/note/${note.id}`)
})

app.post('/note/:id/delete', authMiddleware, async (c) => {
    const id = Number(c.req.param('id'))
    if (!id) return c.status(500)

    const note = await getNote(id)
    if (!canAccess(c.var.user, note)) {
        return c.html(<NoPermissionPage/>)
    }

    await deleteNote(id)
    return c.redirect('/')
})

app.post('/note/:id/save', authMiddleware, async (c) => {
    const id = Number(c.req.param('id'))
    if (!id) {
        return c.status(500)
    }

    const note = await getNote(id)
    if (!canAccess(c.var.user, note)) {
        return c.html(<NoPermissionPage/>)
    }

    const form = await c.req.formData()
    const title = form.get("title")?.toString() ?? "Untitled"
    const text = form.get("text")?.toString() ?? ""

    const updatedNote = await updateNote(id, title.trim() === "" ? "Untitled" : title, text)
    if (!updatedNote) {
        return c.status(500)
    }

    return c.redirect(`/note/${updatedNote.id}`)
})

app.get('/logout', (c) => {
    c.var.session.delete()
    return c.redirect("/login")
})

app.get('/login', (c) => c.html(<LoginPage/>))

app.post('/login', async (c) => {
    const credentials = await parseCredentials(c)
    if (!credentials) return c.status(404)

    const user = await getUser(credentials.username)

    // VULNERABILITY A07:
    // if (!user || user.password !== credentials.password) {
    if (!user || user.password.length !== credentials.password.length) {
        // VULNERABILITY A09:
        // const info = getConnInfo(c)
        // console.warn(JSON.stringify({
        //     event: "login_failed",
        //     time: new Date().toISOString(),
        //     address: info.remote.address
        // }))
        return c.html(<LoginPage error="Invalid username or password"/>)
    }

    await c.var.session.update({username: credentials.username})
    return c.redirect("/")
})

app.get('/register', (c) => c.html(<RegisterPage/>))

app.post('/register', async (c) => {
    const session = await c.var.session.get()
    if (session?.username != null) {
        return c.redirect("/")
    }

    const credentials = await parseCredentials(c)
    if (!credentials) return c.status(404)

    const result = await createUser(credentials.username, credentials.password)
    if (isCreationError(result)) {
        const errorMessages: Record<CreationError, string> = {
            "username_exists": "Invalid username",
            "database_failed": "Failed to create user"
        }
        return c.html(<RegisterPage error={errorMessages[result]}/>)
    }

    await c.var.session.update({username: credentials.username})
    return c.redirect('/')
})

serve({
    fetch: app.fetch,
    port: 3000
}, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
})