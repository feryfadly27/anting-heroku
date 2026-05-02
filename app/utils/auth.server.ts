import bcrypt from "bcryptjs";
import { prisma } from "../db/prisma";
import { getSession } from "./session.server";
import type { User } from "../data/users";

/**
 * Verify credentials and return user if valid
 */
export async function verifyLogin(email: string, password: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) return null;

  // For demo data migration, check if password is plain (from seed) or hashed
  let isValid = false;
  if (user.password === password) {
    // Basic check for plain text (seed data)
    isValid = true;
    // Auto-hash it for security on next login
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
  } else {
    // Normal bcrypt check
    isValid = await bcrypt.compare(password, user.password);
  }

  if (!isValid) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as any,
    wilayah_id: user.wilayah_id || undefined,
    created_at: user.created_at.toISOString(),
  } as User;
}

/**
 * Get user from current session
 */
export async function getAuthUser(request: Request): Promise<User | null> {
  const session = await getSession(request);
  const userId = session.get("userId");

  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as any,
    wilayah_id: user.wilayah_id || undefined,
    created_at: user.created_at.toISOString(),
  } as User;
}

/**
 * Register new user with hashed password
 */
export async function registerUser(
  name: string,
  email: string,
  password: string,
  wilayahId: string,
): Promise<User | null> {
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const wilayah = await prisma.wilayah.findUnique({ where: { id: wilayahId } });
    if (!wilayah) {
      return null;
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "orang_tua", // Default role
        wilayah_id: wilayahId,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      wilayah_id: user.wilayah_id || undefined,
      created_at: user.created_at.toISOString(),
    } as User;
  } catch (error) {
    console.error("Registration error:", error);
    return null;
  }
}
