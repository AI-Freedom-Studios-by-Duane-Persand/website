#!/bin/bash
mongosh 'mongodb+srv://waali:WaliPassword123@cluster0.e5wse.mongodb.net/aifs' --eval "db.users.updateOne({email: 'waali.azmi@gmail.com'}, {\$set: {roles: ['superadmin']}})"
