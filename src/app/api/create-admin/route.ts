import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";

/**
 * GET /api/create-admin - Create admin account (TEMPORARY)
 */
export async function GET() {
  try {
    const email = "makhloufihouda02@gmail.com";
    const password = "admin123";
    const hashedPassword = await hash(password, 12);

    const admin = await db.user.upsert({
      where: { email },
      update: { password: hashedPassword, name: "Administrateur", role: "admin" },
      create: {
        email,
        name: "Administrateur",
        password: hashedPassword,
        role: "admin",
      },
    });

    return NextResponse.json({
      message: "Compte admin créé avec succès",
      email: admin.email,
      password: "admin123",
      role: admin.role,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
