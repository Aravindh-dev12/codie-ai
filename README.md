# Codie AI - AI-Powered Web Development Platform

Codie AI is a **revolutionary full-stack web application** that combines **artificial intelligence** with a modern tech stack - powered by **Convex** on the backend and **Next.js** on the frontend. It transforms the development workflow by generating production-ready code from natural language descriptions.

## 🌟 Key Features

- **AI-Powered Code Generation** – Transform ideas into clean, optimized code with our advanced AI models
- **Next.js Frontend** – Fast, responsive, and SEO-friendly React-based frontend with SSR capabilities
- **Convex Backend** – Scalable, reactive, and real-time database-driven backend with automatic syncing
- **Token-Based Pricing** – Flexible pay-as-you-go model that scales with your development needs
- **One-Click Deployment** – Seamlessly publish projects without complex configuration
- **Real-time Collaboration** – Multi-user editing with intelligent conflict resolution
- **Rich Template Library** – Pre-built, customizable designs for various application types
- 

## 🛠️ Getting Started

Follow these steps to set up and run Webly.io locally:

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Aravindh-dev12/codie-ai.git
cd webly.io
```

### 2️⃣ Install Dependencies

Ensure you have **Node.js** and **Convex CLI** installed. Then run:

```bash
npm install
```

### 3️⃣ Set Up Environment Variables

1. Create a `.env.local` file in the root directory:

   ```bash
   touch .env.local
   # or manually create the file in your editor
   ```

2. Add the required environment variables to your `.env.local` file using the template below:

   ```
   # Authentication
   NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID_KEY=your_google_client_id

   # Convex backend
   CONVEX_DEPLOYMENT=your_convex_deployment_name
   NEXT_PUBLIC_CONVEX_URL=your_convex_url

   # API Keys
   NEXT_PUBLIC_GPT_API_KEY=your_openai_api_key

   # Payment processor
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
   NEXT_PAYPAL_SECRET=your_paypal_secret
   ```

3. **IMPORTANT:** 
   - Never commit your `.env.local` file to the repository
   - Obtain your own API keys from the respective services
   - Variables prefixed with `NEXT_PUBLIC_` will be exposed to the browser


### 4️⃣ Set Up Convex

1. Install Convex CLI globally (if not installed):

   ```bash
   npm install -g convex
   ```

2. Login to Convex and create a new project:

   ```bash
   npx convex dev
   ```

3. Follow the CLI instructions to initialize your **Convex** backend.

### 5️⃣ Run the Development Server

```bash
npm run dev
```

Now open your browser and go to:

```
http://localhost:3000
```

## 📂 Project Structure

```
webly.io/
│── convex/          # Convex backend functions
│── pages/           # Next.js pages
│── components/      # Reusable React components
│── styles/         # Global and component-specific styles
│── public/         # Static assets
│── package.json    # Project dependencies and scripts
└── README.md       # Project documentation
```

## 🚀 Deployment

### Deploy Convex Backend

To deploy the Convex backend to production:

```bash
npx convex deploy
```

### Deploy Next.js Frontend

You can deploy the frontend using **Vercel**, **Netlify**, or any Next.js-compatible platform:

```bash
vercel
```

Or manually build and start the production server:

```bash
npm run build
npm start
```

## 🔐 Security Best Practices

To ensure the security of your application:

1. **Never commit API keys or secrets** to your repository
2. Keep all sensitive information in `.env.local` which is excluded from git
3. Rotate API keys regularly, especially after accidental exposure
4. For production, use a secure secret management solution
5. Prefix variables with `NEXT_PUBLIC_` only when they need to be exposed to the browser
6. Monitor GitHub security alerts for any potential secret exposures

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature-name`).
3. Commit your changes (`git commit -m "Add feature"`).
4. Push to the branch (`git push origin feature-name`).
5. Open a **Pull Request**.
