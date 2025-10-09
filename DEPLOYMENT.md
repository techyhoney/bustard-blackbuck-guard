# Deployment Guide - GIMP-S

This guide will help you deploy the GIMP-S application to Netlify.

## Prerequisites

- A GitHub account (or GitLab/Bitbucket)
- A Netlify account (free tier is sufficient)
- Your Supabase credentials

## Method 1: Deploy via Netlify CLI (Recommended for Quick Deploy)

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Login to Netlify

```bash
netlify login
```

This will open a browser window for authentication.

### Step 3: Build the Project

```bash
npm run build
```

### Step 4: Deploy to Netlify

```bash
netlify deploy --prod
```

Follow the prompts:
- Choose "Create & configure a new site"
- Select your team
- Enter a site name (or leave blank for auto-generated)
- Set deploy path to: `dist`

### Step 5: Set Environment Variables

```bash
netlify env:set VITE_SUPABASE_URL "https://hpqfxtvhmutzypmubbyl.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key-here"
```

### Step 6: Redeploy with Environment Variables

```bash
netlify deploy --prod
```

## Method 2: Deploy via Netlify Dashboard (Recommended for Continuous Deployment)

### Step 1: Push Code to GitHub

1. Create a new repository on GitHub
2. Push your code:

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Connect to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Choose "Deploy with GitHub"
4. Authorize Netlify to access your repositories
5. Select your repository

### Step 3: Configure Build Settings

Netlify will automatically detect settings from `netlify.toml`:

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 18

### Step 4: Add Environment Variables

1. Go to Site settings → Environment variables
2. Add the following variables:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://hpqfxtvhmutzypmubbyl.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

### Step 5: Deploy

1. Click "Deploy site"
2. Wait for the build to complete
3. Your site will be live at `https://[your-site-name].netlify.app`

## Method 3: Manual Deploy (Drag & Drop)

### Step 1: Build the Project Locally

```bash
npm run build
```

This creates a `dist` folder with production-ready files.

### Step 2: Deploy to Netlify

1. Go to [Netlify Drop](https://app.netlify.com/drop)
2. Drag and drop your `dist` folder
3. Your site will be deployed instantly

**Note**: You'll need to manually set environment variables in Site Settings.

## Post-Deployment Steps

### 1. Configure Custom Domain (Optional)

1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Follow the DNS configuration instructions

### 2. Enable HTTPS

HTTPS is automatically enabled by Netlify. If not:
1. Go to Site settings → Domain management
2. Click "Verify DNS configuration"
3. Enable "Force HTTPS"

### 3. Set Up Continuous Deployment

If using GitHub:
1. Any push to the `main` branch will trigger a new deployment
2. Pull requests will create preview deployments

### 4. Monitor Deployment

1. Go to Deploys tab in Netlify dashboard
2. View build logs
3. Check for any errors

## Troubleshooting

### Build Fails

**Error**: "Command failed with exit code 1"

**Solution**:
1. Check Node version (should be 18+)
2. Run `npm run build` locally to identify errors
3. Check build logs in Netlify

### Environment Variables Not Working

**Error**: "Cannot read properties of undefined"

**Solution**:
1. Ensure variables start with `VITE_`
2. Redeploy after adding variables
3. Check variable names match exactly

### 404 on Routes

**Error**: "Page not found" when accessing routes directly

**Solution**: 
- Already handled by `netlify.toml` and `public/_redirects`
- Ensure these files are present in your repository

### Image/Asset Loading Issues

**Error**: Images not loading

**Solution**:
1. Check image paths are correct
2. Ensure images are in `src/images/` or `public/`
3. Verify Supabase storage permissions

## Environment Variables Reference

```bash
# Required for Production
VITE_SUPABASE_URL=https://hpqfxtvhmutzypmubbyl.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Useful Netlify Commands

```bash
# View site info
netlify status

# Open site in browser
netlify open

# View environment variables
netlify env:list

# View build logs
netlify build

# Test functions locally
netlify dev
```

## Security Checklist

- [ ] Environment variables are set correctly
- [ ] HTTPS is enabled
- [ ] Supabase Row Level Security (RLS) is enabled
- [ ] Anon key is used (not service role key)
- [ ] No sensitive data in source code
- [ ] `.env` files are in `.gitignore`

## Support

If you encounter issues:
1. Check Netlify build logs
2. Review Supabase logs
3. Check browser console for errors
4. Verify all environment variables are set

## Next Steps

After successful deployment:
1. Test all functionality
2. Set up monitoring/analytics
3. Configure custom domain
4. Set up staging environment
5. Enable branch deploys for development

---

**Deployed Site**: Your site will be available at `https://[your-site-name].netlify.app`

For any issues, refer to [Netlify Documentation](https://docs.netlify.com/)

