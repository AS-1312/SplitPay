import { Schema, model, models } from 'mongoose';
import type { Group, Member, Expense } from './types';

// Member Schema
const MemberSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  ensName: { type: String, required: true },
  walletAddress: { type: String, required: true },
  avatar: { type: String }
}, { _id: false });

// Expense Schema
const ExpenseSchema = new Schema({
  id: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  paidBy: { type: String, required: true },
  splitBetween: [{ type: String, required: true }],
  category: {
    type: String,
    enum: ['food', 'transport', 'accommodation', 'entertainment', 'other'],
    required: true
  },
  date: { type: Date, required: true, default: Date.now }
}, { _id: false });

// Group Schema
const GroupSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  members: [MemberSchema],
  expenses: [ExpenseSchema],
  createdAt: { type: Date, default: Date.now }
});

// Export models
export const GroupModel = models.Group || model('Group', GroupSchema);