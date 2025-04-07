"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Holiday {
  id: string;
  date: string;
  name: string;
  multiplier: number;
}

export default function HolidaysPage() {
  const [date, setDate] = useState<Date>();
  const [name, setName] = useState('');
  const [multiplier, setMultiplier] = useState(2.0);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  async function loadHolidays() {
    try {
      const res = await fetch('/api/holidays');
      const data = await res.json();
      setHolidays(data);
    } catch (error) {
      toast.error('Failed to load holidays');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !name) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          name,
          multiplier,
        }),
      });

      if (!res.ok) throw new Error('Failed to create holiday');

      toast.success('Holiday added successfully');
      setDate(undefined);
      setName('');
      setMultiplier(2.0);
      loadHolidays();
    } catch (error) {
      toast.error('Failed to add holiday');
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/holidays/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete holiday');

      toast.success('Holiday deleted successfully');
      loadHolidays();
    } catch (error) {
      toast.error('Failed to delete holiday');
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Holiday Management</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add Holiday</CardTitle>
              <CardDescription>
                Set up holidays with custom pay multipliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Holiday Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="number"
                    step="0.1"
                    min="1"
                    max="3"
                    placeholder="Pay Multiplier"
                    value={multiplier}
                    onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                  />
                </div>
                <Button type="submit">Add Holiday</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Holiday List</CardTitle>
              <CardDescription>
                View and manage holidays
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Multiplier</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidays.map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell>
                        {format(new Date(holiday.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{holiday.name}</TableCell>
                      <TableCell>{holiday.multiplier}x</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(holiday.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}