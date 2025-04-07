import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { action } = await request.json();

    if (action === 'in') {
      // Check if already clocked in
      const existingTimeLog = await db.timeLog.findFirst({
        where: {
          userId: user.id,
          clockOut: null,
        },
      });

      if (existingTimeLog) {
        return NextResponse.json(
          { error: 'Already clocked in' },
          { status: 400 }
        );
      }

      const timeLog = await db.timeLog.create({
        data: {
          userId: user.id,
          clockIn: new Date(),
        },
      });

      return NextResponse.json(timeLog);
    } else if (action === 'out') {
      const timeLog = await db.timeLog.findFirst({
        where: {
          userId: user.id,
          clockOut: null,
        },
      });

      if (!timeLog) {
        return NextResponse.json(
          { error: 'Not clocked in' },
          { status: 400 }
        );
      }

      const updatedTimeLog = await db.timeLog.update({
        where: { id: timeLog.id },
        data: { clockOut: new Date() },
      });

      return NextResponse.json(updatedTimeLog);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}