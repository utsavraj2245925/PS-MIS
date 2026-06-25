import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
{
name: {
type: String,
required: true,
},

email: {
  type: String,
  required: true,
  unique: true,
},

password: {
  type: String,
  required: true,
},

role: {
  type: String,
  enum: [
    "SUPER_ADMIN",
    "PLANT_ADMIN",
    "MANAGER",
    "USER",
  ],
  default: "USER",
},

location: {
  type: String,
  required: true,
},

plant: {
  type: String,
  required: true,
},

status: {
  type: String,
  default: "Active",
},


},
{
timestamps: true,
}
);

const User = mongoose.model("User", userSchema);

export default User;
