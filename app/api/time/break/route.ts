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

    const currentTimeLog = await db.timeLog.findFirst({
      where: {
        userId: user.id,
        clockOut: null,
      },
    });

    if (!currentTimeLog) {
      return NextResponse.json(
        { error: 'Not clocked in' },
        { status: 400 }
      );
    }

    if (action === 'start') {
      if (currentTimeLog.breakStart && !currentTimeLog.breakEnd) {
        return NextResponse.json(
          { error: 'Already on break' },
          { status: 400 }
        );
      }

      const updatedTimeLog = await db.timeLog.update({
        where: { id: currentTimeLog.id },
        data: { breakStart: new Date() },
      });

      return NextResponse.json(updatedTimeLog);
    } else if (action === 'end') {
      if (!currentTimeLog.breakStart || currentTimeLog.breakEnd) {
        return NextResponse.json(
          { error: 'No active break' },
          { status: 400 }
        );
      }

      const updatedTimeLog = await db.timeLog.update({
        where: { id: currentTimeLog.id },
        data: { breakEnd: new Date() },
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