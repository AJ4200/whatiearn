// /app/api/create-user/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { name } = await req.json();

  if (!name || name.trim().length === 0) {
    return NextResponse.json({ message: "Name is required" }, { status: 400 });
  }

  try {
    // Create the user in the database using Prisma
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
      },
    });

    // Respond with the newly created user ID
    return NextResponse.json({ userId: newUser.id }, { status: 200 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ message: "Error creating user" }, { status: 500 });
  }
}
