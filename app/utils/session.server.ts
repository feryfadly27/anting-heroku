import { createCookieSessionStorage } from "react-router";

const sessionSecret = process.env.SESSION_SECRET || "default_secret_for_dev_only";

export const sessionStorage = createCookieSessionStorage({
    cookie: {
        name: "__session",
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secrets: [sessionSecret],
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 7 days
    },
});

export async function getSession(request: Request) {
    const cookie = request.headers.get("Cookie");
    return sessionStorage.getSession(cookie);
}

export async function createSessionHeader(userId: string) {
    const session = await sessionStorage.getSession();
    session.set("userId", userId);
    return {
        "Set-Cookie": await sessionStorage.commitSession(session),
    };
}

export async function destroySessionHeader(request: Request) {
    const session = await getSession(request);
    return {
        "Set-Cookie": await sessionStorage.destroySession(session),
    };
}
