# Friends & Food - Setup Guide

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd friends-and-food
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your actual values:

#### Required Variables:

**MongoDB Database:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/friends-and-food
```
- Create a free MongoDB Atlas cluster at https://www.mongodb.com/cloud/atlas
- Click "Connect" → "Connect your application" → Copy the connection string
- Replace `<password>` with your database user password
- Replace `<dbname>` with `friends-and-food`

**JWT Secret:**
```env
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
```
- Generate a secure random string:
  ```bash
  openssl rand -base64 32
  ```

**Vercel Blob Storage:**
```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxx
```
- Sign up at https://vercel.com
- Go to Storage → Create Blob Store
- Copy the read-write token

**Application URLs:**
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Detailed Setup Instructions

### MongoDB Atlas Setup

1. **Create Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for a free account

2. **Create Cluster**
   - Click "Build a Database"
   - Choose the FREE tier (M0)
   - Select a cloud provider and region
   - Click "Create Cluster"

3. **Create Database User**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and strong password
   - Set privileges to "Read and write to any database"
   - Click "Add User"

4. **Whitelist Your IP**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

5. **Get Connection String**
   - Go back to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your user's password
   - Replace `<dbname>` with `friends-and-food`

### Vercel Blob Storage Setup

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub, GitLab, or Bitbucket

2. **Create Blob Store**
   - Go to Storage tab
   - Click "Create Database"
   - Select "Blob"
   - Choose a name (e.g., "friends-and-food-images")
   - Select a region close to your users
   - Click "Create"

3. **Get Token**
   - After creation, copy the `BLOB_READ_WRITE_TOKEN`
   - Add it to your `.env.local` file

### JWT Secret Generation

Generate a secure random string for JWT signing:

**On macOS/Linux:**
```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**Or use an online generator:**
- https://generate-secret.vercel.app/32

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGODB_URI` | ✅ Yes | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `JWT_SECRET` | ✅ Yes | Secret key for JWT signing | `your-secret-key-min-32-chars` |
| `BLOB_READ_WRITE_TOKEN` | ✅ Yes | Vercel Blob storage token | `vercel_blob_rw_xxxxx` |
| `NEXT_PUBLIC_APP_URL` | ✅ Yes | Public application URL | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | ✅ Yes | API base URL | `http://localhost:3000/api` |
| `NEXT_PUBLIC_SOCKET_URL` | ✅ Yes | WebSocket URL | `http://localhost:3000` |
| `JWT_EXPIRES_IN` | ❌ No | JWT token expiration | `7d` (default) |
| `NODE_ENV` | ❌ No | Environment mode | `development` or `production` |

---

## Development

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Run Type Checking
```bash
npm run type-check
# or
npx tsc --noEmit
```

---

## Troubleshooting

### MongoDB Connection Issues

**Error: "MongoNetworkError: failed to connect"**
- Check your IP is whitelisted in MongoDB Atlas Network Access
- Verify your connection string is correct
- Ensure your database user has the correct password

**Error: "MongoServerError: bad auth"**
- Check your database username and password are correct
- Make sure the password doesn't contain special characters that need URL encoding

### Vercel Blob Issues

**Error: "Unauthorized"**
- Verify your `BLOB_READ_WRITE_TOKEN` is correct
- Make sure the token has read and write permissions

### JWT Issues

**Error: "jwt malformed"**
- Check your `JWT_SECRET` is set in `.env.local`
- Ensure the secret is at least 32 characters long

### Port Already in Use

**Error: "Port 3000 is already in use"**
```bash
# Find and kill the process using port 3000
# On macOS/Linux:
lsof -ti:3000 | xargs kill -9

# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## Production Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add all variables from `.env.local`
   - Make sure to update URLs for production:
     - `NEXT_PUBLIC_APP_URL` → Your Vercel domain
     - `NEXT_PUBLIC_API_URL` → Your Vercel domain + `/api`
     - `NEXT_PUBLIC_SOCKET_URL` → Your Vercel domain

4. **Deploy**
   - Vercel will automatically deploy on every push to main

### Other Platforms

For deployment to other platforms (AWS, DigitalOcean, etc.):
1. Build the application: `npm run build`
2. Set environment variables in your hosting platform
3. Start the server: `npm start`
4. Ensure Node.js 18+ is installed

---

## Database Seeding (Optional)

To populate the database with sample data for testing:

```bash
# Create a seed script (if not exists)
npm run seed
```

---

## Getting Help

- **Documentation:** Check the code comments and inline documentation
- **Issues:** Create an issue on GitHub
- **Community:** Join our Discord/Slack (if applicable)

---

## Security Notes

⚠️ **Important:**
- Never commit `.env.local` to version control
- Use strong, unique passwords for MongoDB
- Rotate JWT secrets regularly in production
- Enable 2FA on MongoDB Atlas and Vercel accounts
- Use HTTPS in production
- Keep dependencies updated: `npm audit fix`

---

## Next Steps

After setup, you can:
1. Create your first user account at `/auth/signup`
2. Add some restaurants at `/places`
3. Create events at `/events`
4. Invite friends to join
5. Start planning dining adventures!

Enjoy using Friends & Food! 🍴
