import { notificationService } from "~/db/services/notification.service";
import { getAuthUser } from "~/utils/auth.server";

export async function loader({ request }: { request: Request }) {
  if (request.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const user = await getAuthUser(request);
  if (!user || user.role !== "orang_tua") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limitRaw = url.searchParams.get("limit");
  const parsed = limitRaw ? Number.parseInt(limitRaw, 10) : null;
  const limit = parsed !== null && Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;

  try {
    const data = await notificationService.getParentNotifications({
      userId: user.id,
      wilayahId: user.wilayah_id ?? null,
      limit,
    });
    return Response.json(data);
  } catch (error) {
    console.error("Parent notifications loader error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
