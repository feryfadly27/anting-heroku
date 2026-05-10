import { notificationService } from "~/db/services/notification.service";
import { getAuthUser } from "~/utils/auth.server";

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const user = await getAuthUser(request);
  if (!user || user.role !== "orang_tua") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const markAll = String(formData.get("markAll") || "") === "true";

    if (markAll) {
      return Response.json(
        await notificationService.markAllNotificationsRead({
          userId: user.id,
          wilayahId: user.wilayah_id ?? null,
        })
      );
    }

    const itemsRaw = String(formData.get("items") || "[]");
    const parsed = JSON.parse(itemsRaw) as Array<{ sourceType: string; sourceId: string }>;

    const items = (Array.isArray(parsed) ? parsed : [])
      .filter(
        (x) =>
          (x.sourceType === "informasi" || x.sourceType === "kunjungan_reminder") &&
          typeof x.sourceId === "string" &&
          x.sourceId.length > 0
      )
      .map((x) => ({
        sourceType: x.sourceType as "informasi" | "kunjungan_reminder",
        sourceId: x.sourceId,
      }));

    if (items.length === 0) {
      return Response.json({ success: true });
    }

    return Response.json(
      await notificationService.markNotificationsRead({
        userId: user.id,
        items,
      })
    );
  } catch (error) {
    console.error("Parent notifications mark-read action error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
