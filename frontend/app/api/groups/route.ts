import { NextRequest, NextResponse } from 'next/server';
import { connect } from 'mongoose';
import clientPromise from '@/lib/mongodb';
import { GroupModel } from '@/lib/models';
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
    await connectDB();
    const groups = await GroupModel.find({}).sort({ createdAt: -1 });
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
    await connectDB();
    const body = await request.json();
    const { id, name, members, expenses = [], createdAt = new Date() } = body;

    if (!id || !name || !members) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, members' },
        { status: 400 }
      );
    }

    const newGroup = new GroupModel({
      id,
      name,
      members,
      expenses,
      createdAt
    });

    const savedGroup = await newGroup.save();
    return NextResponse.json({ group: savedGroup }, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}