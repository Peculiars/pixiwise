"use server";

import { redirect } from 'next/navigation';
import Stripe from "stripe";
import { handleError } from '../utils';
import { connectToDatabase } from '../database/mongoose';
import { updateCredits } from './user.actions';
import { CheckoutTransactionParams, CreateTransactionParams } from '../../../types';
import Transaction from '../models/transaction.model';

export async function checkoutCredits(transaction: CheckoutTransactionParams) {
  console.log("🛒 Creating checkout session:", transaction);
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const amount = Number(transaction.amount) * 100;

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amount,
            product_data: {
              name: transaction.plan,
            }
          },
          quantity: 1
        }
      ],
      metadata: {
        plan: transaction.plan,
        credits: transaction.credits.toString(),
        buyerId: transaction.buyerId,
      },
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/profile`,
      cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/`,
    });

    console.log("✅ Checkout session created:", session.id);
    redirect(session.url!);
  } catch (error) {
    console.error("❌ Failed to create checkout session:", error);
    handleError(error);
  }
}

export async function createTransaction(transaction: CreateTransactionParams) {
  console.log("🏗️ Starting transaction creation:", {
    stripeId: transaction.stripeId,
    buyerId: transaction.buyerId,
    amount: transaction.amount,
    credits: transaction.credits
  });
  
  try {
    console.log("📡 Connecting to database...");
    await connectToDatabase();
    console.log("✅ Database connected successfully");

    if (!transaction.stripeId) {
      throw new Error("stripeId is required");
    }
    
    if (!transaction.buyerId) {
      throw new Error("buyerId is required");
    }

    if (transaction.credits <= 0) {
      throw new Error("credits must be greater than 0");
    }

    console.log("🔍 Checking for existing transaction...");
    const existingTransaction = await Transaction.findOne({ 
      stripeId: transaction.stripeId 
    });
    
    if (existingTransaction) {
      console.log("ℹ️ Transaction already exists, skipping creation");
      return JSON.parse(JSON.stringify(existingTransaction));
    }

    const transactionData = {
      stripeId: transaction.stripeId,
      amount: transaction.amount,
      plan: transaction.plan,
      credits: transaction.credits,
      buyer: transaction.buyerId, 
      createdAt: transaction.createdAt || new Date(),
    };
    
    console.log("📝 Creating transaction with data:", transactionData);
    
    const newTransaction = await Transaction.create(transactionData);
    console.log("✅ Transaction created with ID:", newTransaction._id);

    console.log("💰 Updating user credits...");
    console.log("User ID:", transaction.buyerId, "Credits to add:", transaction.credits);
    
    try {
      await updateCredits(transaction.buyerId, transaction.credits);
      console.log("✅ Credits updated successfully");
    } catch (creditError) {
      console.error("❌ Failed to update credits:", creditError);
    }

    const result = JSON.parse(JSON.stringify(newTransaction));
    console.log("🎉 Transaction creation completed successfully");
    return result;
    
  } catch (error) {
    console.error("❌ Transaction creation failed:", error);
    
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    handleError(error);
    throw error;
  }
}


export async function testDatabaseConnection() {
  try {
    console.log("🧪 Testing database connection...");
    await connectToDatabase();
    
    const testDoc = await Transaction.create({
      stripeId: `test_${Date.now()}`,
      amount: 1,
      plan: "test",
      credits: 1,
      buyer: "507f1f77bcf86cd799439011", 
    });
    
    console.log("✅ Test document created:", testDoc._id);
    
    await Transaction.deleteOne({ _id: testDoc._id });
    console.log("✅ Test document cleaned up");
    
    return { success: true, message: "Database connection successful" };
  } catch (error) {
    console.error("❌ Database test failed:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}