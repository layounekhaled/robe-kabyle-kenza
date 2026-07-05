import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Initialize DB for serverless environments before auth
async function createHandler() {
  const { initDb } = await import("@/lib/init-db");
  await initDb();
  return NextAuth(authOptions);
}

let _handler: ReturnType<typeof NextAuth> | null = null;

async function getHandler() {
  if (!_handler) {
    const { initDb } = await import("@/lib/init-db");
    await initDb();
    _handler = NextAuth(authOptions);
  }
  return _handler;
}

export async function GET(...args: Parameters<typeof NextAuth>) {
  const handler = await getHandler();
  return handler(...args);
}

export async function POST(...args: Parameters<typeof NextAuth>) {
  const handler = await getHandler();
  return handler(...args);
}
