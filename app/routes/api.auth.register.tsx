import { data } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { registerUser } from "~/utils/auth.server";
import { createSessionHeader } from "~/utils/session.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const wilayahId = formData.get("wilayah_id") as string;

  if (!name || !email || !password || !wilayahId) {
    return data({ error: "Name, email, password, and wilayah are required" }, { status: 400 });
  }

  const user = await registerUser(name, email, password, wilayahId);

  if (!user) {
    return data({ error: "Registration failed" }, { status: 400 });
  }

  const headers = await createSessionHeader(user.id);

  return data({ user }, { headers });
}
