import mongoose from "mongoose";


const userSchema = new mongoose.Schema(
  {
    clerkUserId: {
      type: String,
      unique: true,
      required: [true, "Please Provide clerkUserId"],
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Please Provide email"],
    },
    name: {
      type: String,
      required: [true, "Please Provide the Name"],
    },
    imageUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

const User = mongoose.model.User || mongoose.model("User", userSchema);

export default User;