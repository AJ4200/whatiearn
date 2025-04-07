import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentTimeLog = await db.timeLog.findFirst({
      where: {
        userId: user.id,
        clockOut: null,
      },
      orderBy: {
        clockIn: 'desc',
      },
    });

    return NextResponse.json({
      clockedIn: !!currentTimeLog,
      onBreak: currentTimeLog?.breakStart && !currentTimeLog?.breakEnd,
      currentTimeLog,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}