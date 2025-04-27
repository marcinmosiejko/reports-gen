## Run The App Locally

This guide will walk you through the steps to set up and run the application on your local machine for development or testing purposes. This project uses **pnpm** for package management and workspace filtering.

**Prerequisites:**

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.js.org/)
- [Git](https://git-scm.com/)
- **pnpm:** If you don't have pnpm installed, you can install it globally using npm:
  ```sh
  npm install -g pnpm
  ```

**Steps:**

1.  **Clone the repository:**

    Open your terminal or command prompt and clone the project repository using Git. You can use either the HTTPS or SSH protocol:

    **Using HTTPS (recommended for most users):**

    ```sh
    git clone https://github.com/marcin_mosiejko/reports-gen
    ```

    **Using SSH (requires SSH key setup with GitHub):**

    ```sh
    git clone git@github.com:marcinmosiejko/reports-gen.git
    ```

    Both commands will download the project files into a new directory named `reports-gen` on your computer. Choose the method that is appropriate for your setup.

2.  **Navigate to the project directory:**

    Change your current directory to the cloned repository:

    ```sh
    cd reports-gen
    ```

3.  **Install packages:**

    Install the necessary dependencies for the entire project and its individual workspaces (server and frontend) using **pnpm**:

    ```sh
    pnpm install
    ```

    This command installs dependencies for all workspaces defined in the project's `pnpm-workspace.yaml` file. **Unlike npm, you typically only need to run `pnpm install` once at the root of the project.** pnpm efficiently links dependencies across workspaces.

4.  **Run the application:**

    You will need to run the backend and frontend development servers in **separate terminal windows, tabs, or processes** to have both running concurrently.

    In one terminal window, run the backend server using **pnpm**:

    ```sh
    pnpm --filter server run dev
    ```

    This command uses pnpm's `--filter` flag to target the `server` workspace and run its `dev` script.

    In a separate terminal window, run the frontend server using **pnpm**:

    ```sh
    pnpm --filter frontend run dev
    ```

    This command uses pnpm's `--filter` flag to target the `frontend` workspace and run its `dev` script.

After running these commands in their respective terminals, you should see output indicating that the development servers are running. The frontend application should be accessible in your web browser at the address specified by the frontend development server (often `http://localhost:3000` or similar).

**Troubleshooting:**

- If you encounter errors during installation, ensure you have **pnpm** installed correctly.
- If you chose the SSH clone method and encounter issues, verify your SSH key setup with GitHub.
- Try deleting the `node_modules` folders (if they exist) and the `pnpm-lock.yaml` file at the root of the project and running `pnpm install` again.
- Ensure you have the correct Node.js version installed if specified in the project's documentation or `package.json`.
