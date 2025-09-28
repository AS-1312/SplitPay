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

// GET - Fetch specific group by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const db = await connectDB();
    const group = await db.collection('groups').findOne({ id: params.id });

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ group });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

// PUT - Update group
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const db = await connectDB();
    const body = await request.json();
    const { name, members } = body;

    const result = await db.collection('groups').findOneAndUpdate(
      { id: params.id },
      { $set: { ...(name && { name }), ...(members && { members }) } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ group: result });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    );
  }
}

// DELETE - Delete group
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const db = await connectDB();
    const result = await db.collection('groups').findOneAndDelete({ id: params.id });

    if (!result) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    );
  }
}