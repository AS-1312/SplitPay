import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

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

// PUT - Update specific expense
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; expenseId: string } }
) {
  try {
    const db = await connectDB();
    const body = await request.json();
    const { description, amount, paidBy, splitBetween, category } = body;

    const updateFields: any = {};
    if (description) updateFields['expenses.$.description'] = description;
    if (amount) updateFields['expenses.$.amount'] = amount;
    if (paidBy) updateFields['expenses.$.paidBy'] = paidBy;
    if (splitBetween) updateFields['expenses.$.splitBetween'] = splitBetween;
    if (category) updateFields['expenses.$.category'] = category;

    const result = await db.collection('groups').findOneAndUpdate(
      { id: params.id, 'expenses.id': params.expenseId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Group or expense not found' },
        { status: 404 }
      );
    }

    const updatedExpense = result.expenses.find(
      (expense: any) => expense.id === params.expenseId
    );

    return NextResponse.json({ expense: updatedExpense, group: result });
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    );
  }
}

// DELETE - Delete specific expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; expenseId: string } }
) {
  try {
    const db = await connectDB();

    const result = await db.collection('groups').findOneAndUpdate(
      { id: params.id },
      { $pull: { expenses: { id: params.expenseId } } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Expense deleted successfully',
      group: result
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}