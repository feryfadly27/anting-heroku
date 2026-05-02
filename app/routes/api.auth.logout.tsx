import { data } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { destroySessionHeader } from "~/utils/session.server";

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return data({ error: "Method not allowed" }, { status: 405 });
    }

    const headers = await destroySessionHeader(request);

    return data({ success: true }, { headers });
}
