# GIMP-S - GIBs Inventory Monitoring and Patrolling System

**GIBs Inventory Monitoring and Patrolling - Siruguppa**

A comprehensive wildlife conservation management system for tracking Great Indian Bustard, Blackbuck, and other species in the Siruguppa region.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/4ff9e63d-c149-47a5-a5e1-76da517761e8) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

### Deploy to Netlify

This project is configured for easy deployment to Netlify.

**Option 1: Deploy via Netlify CLI**

1. Install Netlify CLI:
   ```sh
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```sh
   netlify login
   ```

3. Deploy:
   ```sh
   netlify deploy --prod
   ```

**Option 2: Deploy via Netlify Dashboard**

1. Push your code to GitHub
2. Go to [Netlify](https://app.netlify.com/)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repository
5. Netlify will automatically detect the build settings from `netlify.toml`
6. Add environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Click "Deploy site"

**Option 3: One-Click Deploy**

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

### Environment Variables

Make sure to set the following environment variables in your Netlify dashboard:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Features

- 🦅 **Wildlife Survey Management** - Track Great Indian Bustard, Blackbuck, and other species
- 🌳 **Habitat Assessments** - Monitor and document habitat conditions
- ⚠️ **Threat Documentation** - Record and track conservation threats
- 👥 **Community Interaction** - Log conservation awareness activities
- 📊 **Dynamic Dashboard** - Real-time statistics and analytics
- 🔐 **User Management** - Role-based access control
- 📸 **Image Management** - Secure storage and signed URLs for wildlife photos
