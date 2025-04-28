# Reports Generation MVP

This project is a minimal proof-of-concept (MVP) for a reports generation flow between frontend and backend. Users can schedule reports and receive notifications via **Server-Sent Events** (SSE) when reports are ready — even when navigating between pages.

---

## Notes

- The MVP focuses on demonstrating ux flow over clean code and production readiness.
- Validation, error handling, authentication and types are minimal or missing.
- Database models use simplified or incomplete schemas.
- The worker process and file storage are intentionally very basic.
- The appointments view would typically use server-side pagination; here, a basic query was implemented mainly to add another page and practice MongoDB querying.

---

## Run The App Locally

This guide will walk you through the steps to set up and run the application on your local machine for development or testing purposes.  
The project uses **pnpm** for package management and workspace filtering.

### Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [pnpm](https://pnpm.io/): If you don't have pnpm installed, you can install it globally:

  ```sh
  npm install -g pnpm
  ```

---

### Steps

#### 1. Clone the repository

Open your terminal or command prompt and clone the project repository using Git.

**Using HTTPS (recommended for most users):**

```sh
git clone https://github.com/marcinmosiejko/reports-gen.git
```

**Using SSH (requires SSH key setup with GitHub):**

```sh
git clone git@github.com:marcinmosiejko/reports-gen.git
```

Both commands will download the project files into a new directory named `reports-gen`.

---

#### 2. Navigate to the project directory

```sh
cd reports-gen
```

---

#### 3. Install packages

Install the necessary dependencies for the entire project and its individual workspaces:

```sh
pnpm install
```

This command installs dependencies for all workspaces defined in the `pnpm-workspace.yaml` file.

✅ **Note:** Unlike npm, you typically only need to run `pnpm install` once at the project root — pnpm efficiently links dependencies across workspaces.

---

#### 4. Run the application

You need to run the backend and frontend development servers in **separate terminal windows, tabs, or processes**.

**In one terminal window: run the backend server**

```sh
pnpm --filter server run dev
```

This starts the Express.js server for handling API requests.

**In another terminal window: run the frontend server**

```sh
pnpm --filter frontend run dev
```

This starts the React development server.

After both are running, you can access the frontend application at `http://localhost:3000` (or whichever port is shown).

---

### Troubleshooting

- Ensure **pnpm** is installed correctly.
- If cloning using SSH fails, verify your SSH key configuration with GitHub.
- If you encounter dependency issues, try deleting the `node_modules` folder and `pnpm-lock.yaml` file, then run `pnpm install` again.
- Check that your Node.js version matches the version specified in the project (if applicable).
