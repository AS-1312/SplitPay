import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { Group } from '@/lib/types';

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

// GET - Fetch all groups
export async function GET() {
  try {
    const db = await connectDB();
    const groups = await db.collection('groups').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

// POST - Create new group
export async function POST(request: NextRequest) {
  try {
    const db = await connectDB();
    const body = await request.json();
    const { id, name, members, expenses = [], createdAt = new Date() } = body;

    if (!id || !name || !members) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, members' },
        { status: 400 }
      );
    }

    const newGroup = {
      id,
      name,
      members,
      expenses,
      createdAt
    };

    const result = await db.collection('groups').insertOne(newGroup);
    return NextResponse.json({ group: { ...newGroup, _id: result.insertedId } }, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}