import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { Expense } from '@/lib/types';

// Connect to MongoDB
async function connectDB() {
  try {
    const client = await clientPromise;
    return client.db('splitpay');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// GET - Fetch all expenses for a group
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await connectDB();
    const group = await db.collection('groups').findOne({ id: params.id });

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ expenses: group.expenses || [] });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

// POST - Add new expense to group
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await connectDB();
    const body = await request.json();
    const { id: expenseId, description, amount, paidBy, splitBetween, category, date = new Date() } = body;

    if (!expenseId || !description || !amount || !paidBy || !splitBetween || !category) {
      return NextResponse.json(
        { error: 'Missing required expense fields' },
        { status: 400 }
      );
    }

    const newExpense: Expense = {
      id: expenseId,
      description,
      amount,
      paidBy,
      splitBetween,
      category,
      date: new Date(date)
    };

    const result = await db.collection('groups').findOneAndUpdate(
      { id: params.id },
      { $push: { expenses: newExpense } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ expense: newExpense, group: result }, { status: 201 });
  } catch (error) {
    console.error('Error adding expense:', error);
    return NextResponse.json(
      { error: 'Failed to add expense' },
      { status: 500 }
    );
  }
}