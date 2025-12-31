db = db.getSiblingDB('aifs');
print('All users in database:');
db.users.find().forEach(function(user) {
  print('Email: ' + user.email + ', ID: ' + user._id);
});
print('\nTotal users: ' + db.users.countDocuments());
