/* eslint-disable camelcase */
import { createTransaction } from "@/lib/actions/transaction.action";
import { NextResponse } from "next/server";
import stripe from "stripe";

export async function POST(request: Request) {
  console.log("🚀 Stripe webhook received at:", new Date().toISOString());
  
  try {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature") as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    if (!endpointSecret) {
      console.error("❌ STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    if (!sig) {
      console.error("❌ No stripe signature found");
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
      console.log("✅ Webhook signature verified successfully");
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err);
      return NextResponse.json({ 
        error: "Invalid signature", 
        message: err instanceof Error ? err.message : String(err) 
      }, { status: 400 });
    }

    console.log("📦 Event type:", event.type);
    console.log("📦 Event ID:", event.id);

    if (event.type === "checkout.session.completed") {
      console.log("💳 Processing checkout.session.completed");
      
      const session = event.data.object;
      const { id, amount_total, metadata } = session;
      
      console.log("📋 Session details:", {
        sessionId: id,
        amount_total,
        metadata,
        customer: session.customer,
        payment_status: session.payment_status
      });

      // Validate required fields
      if (!metadata?.buyerId) {
        console.error("❌ Missing buyerId in metadata");
        return NextResponse.json({ error: "Missing buyerId" }, { status: 400 });
      }

      if (!metadata?.plan) {
        console.error("❌ Missing plan in metadata");
        return NextResponse.json({ error: "Missing plan" }, { status: 400 });
      }

      if (!metadata?.credits) {
        console.error("❌ Missing credits in metadata");
        return NextResponse.json({ error: "Missing credits" }, { status: 400 });
      }

      const transaction = {
        stripeId: id,
        amount: amount_total ? amount_total / 100 : 0,
        plan: metadata.plan,
        credits: Number(metadata.credits) || 0,
        buyerId: metadata.buyerId,
        createdAt: new Date(),
      };

      console.log("🏗️ Creating transaction with data:", transaction);

      try {
        const newTransaction = await createTransaction(transaction);
        console.log("✅ Transaction created successfully:", {
          transactionId: newTransaction?._id,
          stripeId: newTransaction?.stripeId
        });
        
        return NextResponse.json({ 
          message: "Transaction processed successfully", 
          transactionId: newTransaction?._id 
        });
      } catch (createError) {
        console.error("❌ Failed to create transaction:", createError);
        return NextResponse.json({ 
          message: "Webhook received but transaction failed",
          error: createError instanceof Error ? createError.message : String(createError)
        }, { status: 200 }); 
      }
    }

    console.log("ℹ️ Unhandled event type:", event.type);
    return NextResponse.json({ message: "Event received" });

  } catch (error) {
    console.error("❌ Webhook processing failed:", error);
    return NextResponse.json({ 
      error: "Webhook processing failed",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
