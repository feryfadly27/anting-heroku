import { prisma } from "~/db/prisma";

export async function loader() {
  try {
    const wilayahList = await prisma.wilayah.findMany({
      where: {
        tipe: {
          in: ["desa", "kelurahan"],
        },
      },
      select: {
        id: true,
        nama_wilayah: true,
        tipe: true,
      },
      orderBy: [{ tipe: "asc" }, { nama_wilayah: "asc" }],
    });

    return Response.json(wilayahList);
  } catch (error) {
    console.error("Wilayah API error:", error);
    return Response.json({ error: "Gagal memuat daftar wilayah" }, { status: 500 });
  }
}
