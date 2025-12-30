// List all databases
admin = db.getSiblingDB('admin');
print('Databases:');
printjson(admin.adminCommand('listDatabases'));

// Check aifs database collections
aifs = db.getSiblingDB('aifs');
print('\nCollections in aifs:');
printjson(aifs.getCollectionNames());

// Try to find users in different collections
print('\nSearching for user in all collections:');
aifs.getCollectionNames().forEach(function(coll) {
  var count = aifs[coll].countDocuments();
  print('Collection: ' + coll + ', Count: ' + count);
  if (count > 0 && count < 100) {
    print('  Sample documents:');
    aifs[coll].find().limit(2).forEach(function(doc) {
      printjson(doc);
    });
  }
});
