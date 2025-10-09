# 🚀 Quick Deploy Guide - GIMP-S to Netlify

The fastest way to get your GIMP-S application live!

## 🎯 Choose Your Method

### Method 1: Automated Script (Easiest) ⭐

```bash
# Make script executable (first time only)
chmod +x deploy.sh

# Run deployment script
./deploy.sh
```

The script will:
- ✅ Check Node.js & npm
- ✅ Install dependencies
- ✅ Build the project
- ✅ Install Netlify CLI
- ✅ Login to Netlify
- ✅ Deploy to production

---

### Method 2: Manual CLI Deploy (Quick)

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Login to Netlify
netlify login

# 3. Build the project
npm run build

# 4. Deploy
netlify deploy --prod --dir=dist

# 5. Set environment variables
netlify env:set VITE_SUPABASE_URL "https://hpqfxtvhmutzypmubbyl.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-key-here"

# 6. Redeploy with env vars
netlify deploy --prod --dir=dist
```

---

### Method 3: Netlify Dashboard (Best for CI/CD)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to https://app.netlify.com/
   - Click "Add new site" → "Import an existing project"
   - Select your GitHub repository

3. **Configure (Auto-detected from netlify.toml)**
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **Add Environment Variables**
   - Go to Site settings → Environment variables
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`

5. **Deploy!**
   - Click "Deploy site"
   - Wait 2-3 minutes
   - Your site is live! 🎉

---

## ⚡ What's Already Configured

You don't need to configure these - they're already set up:

- ✅ `netlify.toml` - Build configuration
- ✅ `public/_redirects` - SPA routing
- ✅ Build command: `npm run build`
- ✅ Publish directory: `dist`
- ✅ Node version: 18

---

## 🔑 Environment Variables Required

After deployment, set these in Netlify:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://hpqfxtvhmutzypmubbyl.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

**How to set:**
1. Netlify Dashboard → Site settings
2. Environment variables
3. Add variable
4. Redeploy (or it will auto-redeploy)

---

## ✅ Post-Deployment

After deploying:

1. **Visit your site**: `https://[your-site].netlify.app`
2. **Test login** with your credentials
3. **Check all pages** work correctly
4. **Verify images** load properly

---

## 🐛 Common Issues

### "Build failed"
- Run `npm run build` locally first
- Check error in Netlify build logs
- Ensure Node 18+ is being used

### "404 on page refresh"
- Already fixed by `_redirects` file
- If still happening, check file exists

### "Cannot connect to database"
- Check environment variables are set
- Verify Supabase URL and key
- Redeploy after setting variables

### "Images not loading"
- Check Supabase storage permissions
- Verify bucket names match code
- Check signed URL generation

---

## 📱 Your App Features

Once deployed, users can:

- 🦅 Track Great Indian Bustard sightings
- 🦌 Monitor Blackbuck populations  
- 🌳 Document habitat assessments
- ⚠️ Report conservation threats
- 👥 Log community interactions
- 📊 View real-time analytics
- 👤 Manage users and roles

---

## 🔗 Useful Links

- **Netlify Dashboard**: https://app.netlify.com/
- **Netlify Docs**: https://docs.netlify.com/
- **Supabase Dashboard**: https://supabase.com/dashboard

---

## 📞 Need Help?

1. Check `DEPLOYMENT.md` for detailed guide
2. Check `DEPLOYMENT_CHECKLIST.md` for step-by-step
3. Review Netlify build logs
4. Check browser console for errors

---

**That's it! Your GIMP-S app is ready to deploy! 🎉**

Choose your preferred method above and get started!

