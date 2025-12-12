import mongoose from "mongoose";

export async function connect() {
  try {
    mongoose.connect(process.env.MONGO_URI);
    const connection = mongoose.connection;

    connection.on("connected", () => {
      console.log("MongoDB connected Succesfully");
    });

    connection.on("error", (err) => {
      console.log(
        "MongoDB connection Error. Please make sure to connect it Properly " +
          err
      );
    });
  } catch (error) {
    console.log("Somethong went Wrong");
    console.log(error);
  }
}
