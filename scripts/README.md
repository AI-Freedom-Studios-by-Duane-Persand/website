# Scripts Directory

Utility, testing, and administration scripts for the AI Freedom Studios platform.

## 📁 Folder Structure

### `/testing/` - Testing & Verification Scripts

Scripts for validating system configuration and connectivity.

#### `test-mongodb-connection.mjs`
Test MongoDB connection and database availability.

```bash
node scripts/testing/test-mongodb-connection.mjs
```

**What it does:**
- Connects to MongoDB using MONGODB_URI
- Lists available databases
- Verifies connection health
- Useful for: Debugging database connection issues

**Requires:**
- `MONGODB_URI` environment variable
- MongoDB running and accessible

---

#### `verify_admin.js`
Verify that an admin user exists in the database.

```bash
node scripts/testing/verify_admin.js
```

**What it does:**
- Connects to database
- Finds users with admin role
- Lists admin accounts
- Useful for: Verifying admin setup after installation

**Requires:**
- `MONGODB_URI` environment variable
- Database populated with user data

---

### `/admin/` - Administration Utilities

Scripts for managing admin users and accounts.

#### `make_admin.js`
Create or promote a user to admin role.

```bash
node scripts/admin/make_admin.js [email]
```

**What it does:**
- Finds user by email
- Adds admin role
- Creates admin user if doesn't exist
- Useful for: Initial setup, admin role management

**Usage:**
```bash
node scripts/admin/make_admin.js admin@example.com
```

**Requires:**
- `MONGODB_URI` environment variable
- User email address

---

#### `update_admin.js`
Update admin user information.

```bash
node scripts/admin/update_admin.js [email] [field] [value]
```

**What it does:**
- Finds admin user by email
- Updates specified field
- Commits changes to database
- Useful for: Admin account maintenance

**Usage:**
```bash
node scripts/admin/update_admin.js admin@example.com name "Admin User"
```

**Requires:**
- `MONGODB_URI` environment variable
- Valid admin email
- Field name and new value

---

#### `list_users.js`
List all users in the database.

```bash
node scripts/admin/list_users.js
```

**What it does:**
- Connects to database
- Lists all users with key info
- Shows roles and status
- Useful for: User audit, troubleshooting

**Output includes:**
- User ID
- Email
- Roles
- Creation date
- Subscription status

**Requires:**
- `MONGODB_URI` environment variable

---

### `/utilities/` - Utility & Helper Scripts

General utility scripts for various tasks.

#### `explore_db.js`
Explore and analyze database structure.

```bash
node scripts/utilities/explore_db.js
```

**What it does:**
- Connects to database
- Lists all collections
- Shows collection stats
- Useful for: Database exploration, debugging

**Requires:**
- `MONGODB_URI` environment variable

---

#### `replicate-image.mjs`
Test Replicate image generation API.

```bash
node scripts/utilities/replicate-image.mjs
```

**What it does:**
- Calls Replicate API with sample prompt
- Generates test image
- Saves output to file
- Useful for: Testing image generation, API validation

**Output:**
- Generated image saved as `replicate-output.json`

**Requires:**
- `REPLICATE_API_TOKEN` environment variable

---

#### `extract-replicate-image.mjs`
Extract and process Replicate API output.

```bash
node scripts/utilities/extract-replicate-image.mjs
```

**What it does:**
- Reads replicate-output.json
- Extracts image URL
- Processes API response
- Useful for: Post-processing generated images

**Requires:**
- `replicate-output.json` from previous script

---

### Root Scripts - Poe API Setup

#### `setup-poe.js`
Interactive wizard to configure the POE API for image/video generation.

```bash
node scripts/setup-poe.js
```

**What it does:**
- Guides you through POE API configuration
- Sets up API URL and authentication
- Configures default models for image/video/text generation
- Sets timeout and feature flags
- Creates/updates `api/.env` file

**Prerequisites:**
- Node.js installed
- POE API account and key from [poe.com/api_key](https://poe.com/api_key)

---

#### `test-poe.js`
Tests POE API configuration and connectivity.

```bash
node scripts/test-poe.js
```

**What it tests:**
1. ✅ Environment variables present
2. ✅ Model configuration valid
3. ✅ Timeout settings configured
4. ✅ Feature flags set
5. ✅ API connection working

---

## 🚀 Quick Reference

### Initial Setup
```bash
# Test database connection
node scripts/testing/test-mongodb-connection.mjs

# Create admin user
node scripts/admin/make_admin.js admin@aifreedomstudios.com

# Verify admin was created
node scripts/testing/verify_admin.js
```

### Development Testing
```bash
# Test MongoDB
node scripts/testing/test-mongodb-connection.mjs

# Test Poe API
node scripts/test-poe.js

# Test Replicate
node scripts/utilities/replicate-image.mjs
```

### Administration
```bash
# List all users
node scripts/admin/list_users.js

# Make user admin
node scripts/admin/make_admin.js email@example.com

# Update admin info
node scripts/admin/update_admin.js admin@example.com name "New Name"
```

### Database Exploration
```bash
# Explore database structure
node scripts/utilities/explore_db.js

# Test connection
node scripts/testing/test-mongodb-connection.mjs
```

## 📋 Environment Variables Required

### For All Scripts
- `MONGODB_URI` - MongoDB connection string

### For Specific Scripts
- `REPLICATE_API_TOKEN` - For Replicate scripts
- `POE_API_KEY` - For Poe API scripts
- `STRIPE_SECRET_KEY` - For payment operations (if needed)

## 🔧 Running Scripts

### Node.js
```bash
# CommonJS (.js files)
node scripts/admin/make_admin.js

# ES Modules (.mjs files)
node scripts/testing/test-mongodb-connection.mjs
```

### PowerShell (Windows)
```powershell
node scripts/admin/make_admin.js
```

### Bash (Linux/Mac)
```bash
node scripts/admin/make_admin.js
```

## 📝 Creating New Scripts

When adding new scripts:

1. **Choose appropriate folder:**
   - `/testing/` - Testing and verification
   - `/admin/` - User and system administration
   - `/utilities/` - General utilities

2. **Use consistent naming:**
   - Use descriptive names
   - Use hyphens for multi-word names
   - Use `.js` for CommonJS, `.mjs` for ES modules

3. **Add documentation:**
   - Include usage comments
   - Document required environment variables
   - Update this README

## 🐛 Troubleshooting

### "Cannot find module" Error
- Ensure you're in the project root directory
- Check Node.js version (v18+ required)
- Run `npm install` to install dependencies

### "ECONNREFUSED" Error
- Check MongoDB connection string
- Verify MongoDB is running
- Check firewall/network access

### "API Key Invalid" Error
- Verify environment variable is set
- Check `.env` file exists
- Ensure API key has correct permissions

### "Authentication Failed" Error
- Verify credentials are correct
- Check user exists in database
- Verify user has required role

## 📚 Related Documentation

- [Getting Started](../docs/guides/GETTING_STARTED.md)
- [MongoDB Setup](../docs/guides/MONGODB_ATLAS_CONNECTION_FIX.md)
- [API Configuration](../docs/guides/IMPLEMENTATION_SUMMARY.md)
- [Architecture](../docs/architecture/system-overview.md)

---

**Last Updated**: December 31, 2024
