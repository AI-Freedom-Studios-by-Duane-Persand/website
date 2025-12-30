// Update user to admin
db.users.updateOne(
  { email: "waali.azmi@gmail.com" },
  { $set: { roles: ["superadmin"] } }
);

// Show the updated user
db.users.findOne({ email: "waali.azmi@gmail.com" });
