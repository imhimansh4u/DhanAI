import { currentUser } from "@clerk/nextjs/server";
import User from "@/models/userModel";
import { connect } from "@/dbConfig/dbConfig";

export const checkUser = async () => {
  const user = await currentUser();
  // This will check that our User Exists in the Clerk Database or not
  if (!user) {
    console.log("No Clerk User found(Not Logged In). ");
    return null;
  }

  try {
    await connect();
    let loggedInUser = await User.findOne({ clerkUserId: user.id });
    if (!loggedInUser) {
      loggedInUser = await User.create({
        clerkUserId: user.id,
        email: user.emailAddresses[0].emailAddress,
        name: user.fullName || "Unnamed User",
        imageUrl: user.imageUrl,
      });
      console.log("New User Added in our Database");
    } else {
      console.log("User already exists in our database");
    }

    return loggedInUser;
  } catch (error) {
    console.error("Error is : " + error);
  }
};
