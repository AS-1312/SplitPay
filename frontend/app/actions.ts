"use server";

import client from "@/lib/mongodb";
import type { Group, Expense } from "@/lib/types";

export async function testDatabaseConnection() {
  let isConnected = false;
  try {
    const mongoClient = await client.connect();
    // Send a ping to confirm a successful connection
    await mongoClient.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    ); // because this is a server action, the console.log will be outputted to your terminal not in the browser
    return !isConnected;
  } catch (e) {
    console.error(e);
    return isConnected;
  }
}

// Groups Actions
export async function getAllGroups(): Promise<Group[]> {
  try {
    const mongoClient = await client.connect();
    const db = mongoClient.db("splitpay");
    const groups = await db.collection("groups").find({}).sort({ createdAt: -1 }).toArray();

    return groups.map(group => ({
      id: group.id,
      name: group.name,
      members: group.members || [],
      expenses: group.expenses || [],
      createdAt: group.createdAt
    }));
  } catch (e) {
    console.error("Error fetching groups:", e);
    throw new Error("Failed to fetch groups");
  }
}

export async function getGroupById(id: string): Promise<Group | null> {
  try {
    const mongoClient = await client.connect();
    const db = mongoClient.db("splitpay");
    const group = await db.collection("groups").findOne({ id });

    if (!group) return null;

    return {
      id: group.id,
      name: group.name,
      members: group.members || [],
      expenses: group.expenses || [],
      createdAt: group.createdAt
    };
  } catch (e) {
    console.error("Error fetching group:", e);
    throw new Error("Failed to fetch group");
  }
}

export async function createGroup(group: Group): Promise<Group> {
  try {
    const mongoClient = await client.connect();
    const db = mongoClient.db("splitpay");

    const result = await db.collection("groups").insertOne({
      id: group.id,
      name: group.name,
      members: group.members,
      expenses: group.expenses,
      createdAt: group.createdAt
    });

    if (!result.acknowledged) {
      throw new Error("Failed to create group");
    }

    return group;
  } catch (e) {
    console.error("Error creating group:", e);
    throw new Error("Failed to create group");
  }
}

export async function updateGroup(id: string, updates: Partial<Group>): Promise<Group> {
  try {
    const mongoClient = await client.connect();
    const db = mongoClient.db("splitpay");

    const result = await db.collection("groups").findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );

    if (!result) {
      throw new Error("Group not found");
    }

    return {
      id: result.id,
      name: result.name,
      members: result.members || [],
      expenses: result.expenses || [],
      createdAt: result.createdAt
    };
  } catch (e) {
    console.error("Error updating group:", e);
    throw new Error("Failed to update group");
  }
}

export async function deleteGroup(id: string): Promise<void> {
  try {
    const mongoClient = await client.connect();
    const db = mongoClient.db("splitpay");

    const result = await db.collection("groups").deleteOne({ id });

    if (result.deletedCount === 0) {
      throw new Error("Group not found");
    }
  } catch (e) {
    console.error("Error deleting group:", e);
    throw new Error("Failed to delete group");
  }
}

// Expenses Actions
export async function addExpenseToGroup(groupId: string, expense: Expense): Promise<Group> {
  try {
    const mongoClient = await client.connect();
    const db = mongoClient.db("splitpay");

    const result = await db.collection("groups").findOneAndUpdate(
      { id: groupId },
      { $push: { expenses: expense as any } },
      { returnDocument: "after" }
    );

    if (!result) {
      throw new Error("Group not found");
    }

    return {
      id: result.id,
      name: result.name,
      members: result.members || [],
      expenses: result.expenses || [],
      createdAt: result.createdAt
    };
  } catch (e) {
    console.error("Error adding expense:", e);
    throw new Error("Failed to add expense");
  }
}

export async function updateExpense(groupId: string, expenseId: string, updates: Partial<Expense>): Promise<Group> {
  try {
    const mongoClient = await client.connect();
    const db = mongoClient.db("splitpay");

    const updateFields: any = {};
    Object.keys(updates).forEach(key => {
      updateFields[`expenses.$.${key}`] = updates[key as keyof Expense];
    });

    const result = await db.collection("groups").findOneAndUpdate(
      { id: groupId, "expenses.id": expenseId },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      throw new Error("Group or expense not found");
    }

    return {
      id: result.id,
      name: result.name,
      members: result.members || [],
      expenses: result.expenses || [],
      createdAt: result.createdAt
    };
  } catch (e) {
    console.error("Error updating expense:", e);
    throw new Error("Failed to update expense");
  }
}

export async function deleteExpense(groupId: string, expenseId: string): Promise<Group> {
  try {
    const mongoClient = await client.connect();
    const db = mongoClient.db("splitpay");

    const result = await db.collection("groups").findOneAndUpdate(
      { id: groupId },
      { $pull: { expenses: { id: expenseId } as any } },
      { returnDocument: "after" }
    );

    if (!result) {
      throw new Error("Group not found");
    }

    return {
      id: result.id,
      name: result.name,
      members: result.members || [],
      expenses: result.expenses || [],
      createdAt: result.createdAt
    };
  } catch (e) {
    console.error("Error deleting expense:", e);
    throw new Error("Failed to delete expense");
  }
}

// Member Management Actions
export async function exitGroup(groupId: string, memberId: string): Promise<Group | null> {
  try {
    const mongoClient = await client.connect();
    const db = mongoClient.db("splitpay");

    // First check if member has any outstanding expenses
    const group = await db.collection("groups").findOne({ id: groupId });
    if (!group) {
      throw new Error("Group not found");
    }

    // Check if member has outstanding balances
    const memberExpenses = group.expenses?.filter((expense: any) =>
      expense.paidBy === memberId || expense.splitBetween?.includes(memberId)
    ) || [];

    if (memberExpenses.length > 0) {
      throw new Error("Cannot exit group with outstanding expenses. Please settle all balances first.");
    }

    // Remove member from group
    const result = await db.collection("groups").findOneAndUpdate(
      { id: groupId },
      { $pull: { members: { id: memberId } as any } },
      { returnDocument: "after" }
    );

    if (!result) {
      throw new Error("Failed to exit group");
    }

    // If no members left, delete the group
    if (!result.members || result.members.length === 0) {
      await db.collection("groups").deleteOne({ id: groupId });
      return null; // Group deleted
    }

    return {
      id: result.id,
      name: result.name,
      members: result.members || [],
      expenses: result.expenses || [],
      createdAt: result.createdAt
    };
  } catch (e) {
    console.error("Error exiting group:", e);
    throw new Error(e instanceof Error ? e.message : "Failed to exit group");
  }
}

export async function removeMemberFromGroup(groupId: string, memberId: string): Promise<Group> {
  try {
    const mongoClient = await client.connect();
    const db = mongoClient.db("splitpay");

    const result = await db.collection("groups").findOneAndUpdate(
      { id: groupId },
      { $pull: { members: { id: memberId } as any } },
      { returnDocument: "after" }
    );

    if (!result) {
      throw new Error("Group not found");
    }

    return {
      id: result.id,
      name: result.name,
      members: result.members || [],
      expenses: result.expenses || [],
      createdAt: result.createdAt
    };
  } catch (e) {
    console.error("Error removing member:", e);
    throw new Error("Failed to remove member from group");
  }
}
