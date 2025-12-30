# MongoDB Atlas Connection Troubleshooting Guide

## Problem
The NestJS API cannot connect to MongoDB Atlas, showing repeated connection retry errors:
```
Unable to connect to the database. Retrying (1)...
```

## Root Causes & Solutions

### 1. **IP Whitelist (Most Common)**
MongoDB Atlas requires your IP address to be whitelisted for security.

**Solution:**
1. Go to MongoDB Atlas Dashboard: https://cloud.mongodb.com
2. Navigate to: **Network Access** → **IP Whitelist**
3. Click **+ Add IP Address**
4. Choose one of:
   - **Add Current IP**: Adds your current machine IP
   - **Allow Access from Anywhere**: Add `0.0.0.0/0` (for development only, not recommended for production)
5. Click **Confirm**
6. Wait 1-2 minutes for changes to take effect

### 2. **Connection String Issues**
Special characters in passwords must be URL-encoded.

**Fixed in:** `.env`
- Special chars: `!` → `%21`, `@` → `%40`, `#` → `%23`, etc.
- Correct format: `mongodb+srv://username:password@cluster.mongodb.net/database?appName=...`

### 3. **Database Configuration**
Updated MongoDB options in `api/src/app.module.ts`:
```typescript
MongooseModule.forRoot(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,  // 10 second timeout
  socketTimeoutMS: 45000,           // 45 second socket timeout
  retryWrites: true,                // Automatic retry
  retryReads: true,                 // Automatic retry
  maxPoolSize: 10,                  // Connection pool
  minPoolSize: 2,
})
```

### 4. **Connection String Components**
Verify your connection string has:
- **Cluster**: `clusterbeta` (example)
- **Region**: `.mongodb.net` domain
- **Auth**: Username and URL-encoded password
- **AppName**: Optional but recommended

Format:
```
mongodb+srv://[username]:[password]@[cluster].[region].mongodb.net/?appName=[AppName]
```

## Steps to Fix Now

1. **If you haven't whitelisted yet:**
   - Go to MongoDB Atlas Network Access
   - Add your IP (0.0.0.0/0 for dev, or your specific IP)
   - Wait 1-2 minutes

2. **Verify connection string in `.env`:**
   ```env
   MONGO_URI=mongodb+srv://aifreedomstudios_user:9%21bi%21%40tG6V3UHEM@clusterbeta.i42vzei.mongodb.net/?appName=ClusterBeta
   MONGODB_URI=mongodb+srv://aifreedomstudios_user:9%21bi%21%40tG6V3UHEM@clusterbeta.i42vzei.mongodb.net/?appName=ClusterBeta
   ```

3. **Restart the API:**
   ```bash
   npm run dev:api
   ```

4. **Check logs for success:**
   ```bash
   tail -f api/logs/api.log | grep -i mongodb
   ```
   Should see: `MongoDB connected successfully` if working

## Diagnosis
If still failing after whitelisting:

1. **Test connectivity manually:**
   ```bash
   mongosh "mongodb+srv://aifreedomstudios_user:password@clusterbeta.i42vzei.mongodb.net/aifreedomstudios"
   ```

2. **Check cluster status:**
   - In Atlas: Clusters → View cluster status
   - Ensure cluster is "Active" (not paused)

3. **Verify credentials:**
   - Username: `aifreedomstudios_user`
   - Password matches in `.env`
   - Check if password changed recently

## Success Indicator
When connected successfully, logs should show:
```json
{"context":"AppModule","level":"info","message":"MongoDB connected successfully"}
```

And API should start listening on port 3001.
