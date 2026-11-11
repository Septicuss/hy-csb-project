import {getNotes, type Note, type User} from "./data.js";
import type {FC, PropsWithChildren} from "hono/jsx";

export const Layout: FC<PropsWithChildren<{ title?: string }>> = ({title = "Notes", children}) => (
    <html>
    <body>
    <h1>{title}</h1>
    {children}
    </body>
    </html>
)

export const NoteLink: FC<{ note: Note }> = ({note}) => (
    <a href={"/note/" + note.id}>{note.title}</a>
)

export const NotePage: FC<{ note: Note, edit?: boolean }> = ({note, edit = false}) => (
    <Layout title={edit ? "" : note.title}>
        <form action={edit ? `/note/${note.id}/save` : `/note/${note.id}/edit`} method={edit ? "post" : "get"}>
            {edit && <input name="title" type="text" value={note.title}/>}
            <div>
                <br/>
                <a href="/">{"<"} Back</a>
                <br/>
                <br/>
            </div>
            <div>
                <span>By {note.username}</span>
                <br/>
                {edit ? (
                    <>
                        <input name="text" type="text" value={note.text}/>
                        <br/>
                        <button type="submit">Save</button>
                    </>
                ) : (
                    <>
                        {/* VULNERABILITY A05:*/}
                        {/* <p>{note.text}</p> */}
                        <p dangerouslySetInnerHTML={{__html: note.text}}></p>
                        <button type="submit">Edit</button>
                    </>
                )}
            </div>
        </form>
    </Layout>
)

export const HomePage: FC<{ user: User }> = async ({user}) => {
    const notes = await getNotes(user.username)

    return (
        <Layout>
            <p>You are {user.username}!</p>
            <div>
                <form action="/note" method="post">
                    <h3>Create a new note:</h3>
                    <label for="title">Title</label>
                    <input id="title" name="title" type="text"/>
                    <button type="submit">Create</button>
                </form>
            </div>
            <div>
                <h3>Your notes:</h3>
                <ul>
                    {notes.map(note => (
                        <li key={note.id}>
                            <NoteLink note={note}/>
                            <form action={`/note/${note.id}/delete`} method="post">
                                <button type="submit">Delete</button>
                            </form>
                        </li>
                    ))}
                </ul>
            </div>
            <a href="/logout">Logout</a>
        </Layout>
    )
}

export const LoginPage: FC<{ error?: string }> = ({error}) => (
    <Layout title="Login">
        {error && <span style="color: red">{error}</span>}
        <form action="/login" method="post">
            <label for="username">Username</label>
            <input id="username" name="username" type="text"/>
            <br/>
            <label for="password">Password</label>
            <input id="password" name="password" type="password"/>
            <button type="submit">Login</button>
        </form>
        <a href="/register">No account? Register here.</a>
    </Layout>
)

export const RegisterPage: FC<{ error?: string }> = ({error}) => (
    <Layout title="Register">
        {error && <span style="color: red">{error}</span>}
        <form action="/register" method="post">
            <section>
                <label for="username">
                    Username
                    <input id="username" name="username" type="text"/>
                </label>
            </section>
            <section>
                <label for="password">
                    Password
                    <input id="password" name="password" type="password"/>
                </label>
            </section>
            <button type="submit">Register</button>
        </form>
        <a href="/login">Already have an account? Login.</a>
    </Layout>
)

const ErrorPage: FC<{error: string}> = ({error}) => (
    <Layout title={error}>
        <a href="/">Back to homepage</a>
    </Layout>
)

export const NotFoundPage = () => (<ErrorPage error="404 Not Found" />)
export const NoPermissionPage = () => (<ErrorPage error="No permission" />)