import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
              WhatIEarn App
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Track your work hours and calculate payroll with ease
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Card className="p-6">
              <Clock className="h-12 w-12 mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-2">Time Tracking</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Clock in/out and manage breaks with a simple interface
              </p>
            </Card>
            <Card className="p-6">
              <Clock className="h-12 w-12 mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-2">Pay Calculation</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatic overtime and holiday pay calculations
              </p>
            </Card>
            <Card className="p-6">
              <Clock className="h-12 w-12 mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-2">Reports</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Generate detailed reports and analytics
              </p>
            </Card>
          </div>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}