/* eslint-disable camelcase */
import { clerkClient } from "@clerk/nextjs/server";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { createUser, deleteUser, updateUser } from "@/lib/actions/user.actions";

export async function POST(req: Request) {
  console.log("🚀 Webhook received!");
  
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("❌ WEBHOOK_SECRET missing");
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("❌ Missing svix headers");
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`📋 Event type: ${eventType}, ID: ${id}`);

  // CREATE
  if (eventType === "user.created") {
    console.log("👤 Processing user.created event");
    
    const { id, email_addresses, image_url, first_name, last_name, username } = evt.data;

    const user = {
      clerkId: id,
      email: email_addresses[0].email_address,
      username: username || null, 
      firstName: first_name || "User",
      lastName: last_name || "User",
      photo: image_url || "https://via.placeholder.com/150", 
    };

    console.log("📝 User object to create:", user);

    try {
      const newUser = await createUser(user);
      console.log("✅ User created successfully:", newUser);

      if (newUser) {
        await (await clerkClient()).users.updateUserMetadata(id, {
          publicMetadata: {
            userId: newUser._id,
          },
        });
        console.log("✅ Public metadata updated");
      }

      return NextResponse.json({ message: "OK", user: newUser });
    } catch (error: any) {
      console.error("❌ Error creating user:", error);
      return NextResponse.json(
        { message: "Error creating user", error: error.message }, 
        { status: 500 }
      );
    }
  }

  // UPDATE
  if (eventType === "user.updated") {
    console.log("🔄 Processing user.updated event");
    
    const { id, image_url, first_name, last_name, username } = evt.data;

    const user = {
      firstName: first_name || "User",
      lastName: last_name || "User",
      username: username || null, 
      photo: image_url || "https://via.placeholder.com/150",
    };

    try {
      const updatedUser = await updateUser(id, user);
      console.log("✅ User updated successfully:", updatedUser);
      return NextResponse.json({ message: "OK", user: updatedUser });
    } catch (error: any) {
      console.error("❌ Error updating user:", error);
      return NextResponse.json(
        { message: "Error updating user", error: error.message }, 
        { status: 500 }
      );
    }
  }

  // DELETE
  if (eventType === "user.deleted") {
    console.log("🗑️ Processing user.deleted event");
    
    const { id } = evt.data;

    try {
      const deletedUser = await deleteUser(id!);
      console.log("✅ User deleted successfully:", deletedUser);
      return NextResponse.json({ message: "OK", user: deletedUser });
    } catch (error: any) {
      console.error("❌ Error deleting user:", error);
      return NextResponse.json(
        { message: "Error deleting user", error: error.message }, 
        { status: 500 }
      );
    }
  }

  console.log(`Webhook with ID ${id} and type ${eventType} processed`);
  return NextResponse.json({ message: "Webhook processed" }, { status: 200 });
}