db = db.getSiblingDB('aifs');
result = db.users.updateOne(
  { email: 'waali.azmi@gmail.com' },
  { $set: { roles: ['superadmin'] } }
);
print('Update result:');
print('Matched:', result.matchedCount);
print('Modified:', result.modifiedCount);
print('\nUser after update:');
printjson(db.users.findOne({ email: 'waali.azmi@gmail.com' }));
