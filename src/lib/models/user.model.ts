import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  clerkId: { type: String, required: true, unique: true},
  email: { type: String, required: true, unique: true},
  username: { type: String, required: false, unique: true, sparse: true, lowercase: true, match: /^[a-z0-9_]+$/},
  photo: { type: String, required: true,},
  firstName: { type: String,},
  lastName: {type: String},
  planId: { type: Number, default: 1,},
  creditBalance: { type: Number, default: 10,},
  profileCompleted: { type: Boolean, default: false },
});

const User = models?.User || model("User", UserSchema);

export default User;