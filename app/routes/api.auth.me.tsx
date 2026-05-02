import { data } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getAuthUser } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getAuthUser(request);
    return data({ user });
}
