import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { userId, actionType } = await req.json();

    // Validate input
    if (!userId || !actionType) {
      return NextResponse.json(
        { message: "User ID and action type are required" },
        { status: 400 }
      );
    }

    if (!["CLOCK_IN", "CLOCK_OUT", "START_BREAK", "END_BREAK"].includes(actionType)) {
      return NextResponse.json(
        { message: "Invalid action type" },
        { status: 400 }
      );
    }

    // Check for ongoing shift
    const ongoingShift = await prisma.shift.findFirst({
      where: {
        userId,
        clockOut: null, // No clockOut means the shift is ongoing
      },
    });

    // Handle action types
    if (actionType === "CLOCK_IN") {
      if (ongoingShift) {
        return NextResponse.json(
          { message: "User is already clocked in" },
          { status: 400 }
        );
      }

      const newShift = await prisma.shift.create({
        data: {
          userId,
          clockIn: new Date(),
        },
      });

      return NextResponse.json(newShift, { status: 200 });
    }

    if (!ongoingShift) {
      return NextResponse.json(
        { message: "No ongoing shift found for this user" },
        { status: 400 }
      );
    }

    if (actionType === "CLOCK_OUT") {
      const updatedShift = await prisma.shift.update({
        where: { id: ongoingShift.id },
        data: { clockOut: new Date() },
      });

      return NextResponse.json(updatedShift, { status: 200 });
    }

    if (actionType === "START_BREAK") {
      const updatedShift = await prisma.shift.update({
        where: { id: ongoingShift.id },
        data: { breakStart: new Date() },
      });

      return NextResponse.json(updatedShift, { status: 200 });
    }

    if (actionType === "END_BREAK") {
      const updatedShift = await prisma.shift.update({
        where: { id: ongoingShift.id },
        data: { breakEnd: new Date() },
      });

      return NextResponse.json(updatedShift, { status: 200 });
    }

    return NextResponse.json(
      { message: "Unhandled action type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing shift action:", error);
    return NextResponse.json(
      { message: "Error processing shift action", error: String(error) },
      { status: 500 }
    );
  }
}
