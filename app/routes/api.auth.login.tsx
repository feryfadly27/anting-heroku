import { data } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { verifyLogin } from "~/utils/auth.server";
import { createSessionHeader } from "~/utils/session.server";

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return data({ error: "Method not allowed" }, { status: 405 });
    }

    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return data({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await verifyLogin(email, password);

    if (!user) {
        return data({ error: "Invalid credentials" }, { status: 401 });
    }

    const headers = await createSessionHeader(user.id);

    return data({ user }, { headers });
}
