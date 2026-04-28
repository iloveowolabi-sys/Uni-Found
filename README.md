# UniFound

UniFound is a centralized, real-time Lost and Found application designed specifically for university campuses. It helps students and staff easily report lost items, log found items, and reunite owners with their belongings.

## Features

* **Report Lost & Found Items:** Easily submit reports for items you've lost or found around campus.
* **Image Uploads:** Attach images to your reports to help identify items quickly.
* **Real-time Notifications:** Get instant updates when new items are reported, claimed, or resolved.
* **Search & Filter:** Browse through reported items and filter by category or campus location.
* **Admin Dashboard:** Dedicated admin panel to manage reports, update statuses, and oversee the platform.
* **Secure Authentication:** User accounts, email verification, and password resets.

## Tech Stack

* **Frontend:** React, TypeScript, Tailwind CSS, React Router, Vite
* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL (pg pool)
* **Icons:** Lucide React

## Getting Started

### Prerequisites
* Node.js (v18 or higher)
* npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd unifound
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in a `.env` file:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:6543/unifound"
   JWT_SECRET=your_super_secret_jwt_key
   SMTP_HOST=smtp.your-email-provider.com
   SMTP_PORT=587
   SMTP_USER=your_email@example.com
   SMTP_PASS=your_email_password
   SMTP_FROM="UniFound" <noreply@unifound.com>
   APP_URL=http://localhost:3000
   ```

4. Start the development server (runs both frontend and backend):
   ```bash
   npm run dev
   ```

## Deploying to Azure

Follow these steps to deploy the application to Microsoft Azure App Service. This assumes deployment via the cross-platform Azure CLI.

### Prerequisites for Deployment
1. Sign up for an [Azure Account](https://azure.microsoft.com/).
2. Install the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli).
3. Ensure your local project is checked into an isolated Git branch/repository.

### Step-by-Step Deployment

**1. Log in to Azure**
```bash
az login
```

**2. Create a Resource Group**
Group your resources into a logical container (e.g., in the `eastus` region).
```bash
az group create --name UniFoundResourceGroup --location eastus
```

**3. Create an App Service Plan**
Create a plan that defines the underlying hosting resources. We'll use a basic Linux plan.
```bash
az appservice plan create --name UniFoundAppServicePlan --resource-group UniFoundResourceGroup --sku B1 --is-linux
```

**4. Create the Web App**
Create a Web App instance within the plan. Node.js 18 is recommended. Replacing `<your-app-name>` with a unique identifier (like `unifound-prod-123`).
```bash
az webapp create --resource-group UniFoundResourceGroup --plan UniFoundAppServicePlan --name <your-app-name> --runtime "NODE:18-lts" --deployment-local-git
```
*Note the Git deployment URL returned by this command. It will look like: `https://<deployment-username>@<your-app-name>.scm.azurewebsites.net/<your-app-name>.git`*

**5. Configure Environment Variables**
Set the necessary environment variables explicitly via the CLI. Ensure you provide your true production values.
```bash
az webapp config appsettings set --resource-group UniFoundResourceGroup --name <your-app-name> --settings \
  JWT_SECRET="your_production_secret_key" \
  SMTP_HOST="your_smtp_host" \
  SMTP_PORT="587" \
  SMTP_USER="your_smtp_user" \
  SMTP_PASS="your_smtp_password" \
  SMTP_FROM="noreply@yourdomain.com" \
  APP_URL="https://<your-app-name>.azurewebsites.net"
```

**6. Set the Startup Command**
Azure needs to know how to start the app. Since your app builds the React code into `dist` and runs an Express server from `server.ts`, we instruct Azure to use `npm start`.
```bash
az webapp config set --resource-group UniFoundResourceGroup --name <your-app-name> --startup-file "npm start"
```

**7. Push Code to Azure**
Add the Azure Git remote utilizing the URL obtained in Step 4, and deploy:
```bash
git remote add azure <deployment-url-from-step-4>
git push azure main
```
*Azure will automatically start building your application (`npm install`, `npm run build`), and spin up the server based on the startup command.*

### Important PostgreSQL Note for Azure
Since this application now uses a genuine PostgreSQL connection via `pg`, it is completely ready for horizontal scaling on Azure. Be sure to provision an **Azure Database for PostgreSQL Flexible Server** and provide its connection string in your App Service configuration as `DATABASE_URL`.

## Usage

* **Students:** Explore the platform to track lost and found items. Register using your email address and verify your account.
* **Admins:** To bootstrap an admin account, sign up with  `i.love.owolabi@gmail.com`. Admins have access to the Admin Dashboard to manage statuses, moderate users, and resolve items.

## License

This project is licensed under the MIT License.
