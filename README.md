# Hasan Here Exam Portal

Hasan Here Exam Portal is a comprehensive desktop application built with Next.js and Electron, designed for creating, managing, and taking examinations in Reading, Listening, and Writing. It provides separate interfaces for teachers to manage content and for examinees to take tests.

[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/TZWxC8Qy5AX)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/chowdhury-zaber-bin-zahids-projects/v0-next-js-login-website)

## Features

### For Teachers:
- **Secure Login:** Teachers can log in with a username and password.
- **Question Management:**
    - **Create:** Add new questions for Reading, Listening, and Writing sections.
    - **Manage:** Edit, delete, and view existing question sets.
    - **Filter & Search:** Easily find questions with search and date filtering options.
- **Submission Review:** View and manage all student submissions, with the ability to view generated PDF reports.

### For Examinees:
- **Registration:** Examinees can register with their name and ID.
- **Exam Modules:** Take exams in three different modules:
    - **Reading:** Multiple passages with various instruction groups and question types.
    - **Listening:** Listen to audio clips and answer related questions.
    - **Writing:** Complete two-part writing tasks, including prompts with images.
- **PDF Generation:** Exam submissions are automatically converted to PDF format.

### General:
- **File Storage:** Manages storage for audio files, images for writing prompts, and generated PDF submissions.
- **Desktop Application:** Cross-platform desktop application built with Electron.

## Technologies Used

- **Framework:** [Next.js](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/)
- **Database:** [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- **Desktop App:** [Electron](https://www.electronjs.org/)
- **Packaging:** [electron-builder](https://www.electron.build/)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.17.0 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  Clone the repository:
    ```bash
    git clone [https://github.com/chy-zaber-bin-zahid/hasan-here-exam-portal.git](https://github.com/chy-zaber-bin-zahid/hasan-here-exam-portal.git)
    cd hasan-here-exam-portal
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Application

-   **Run the Next.js development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

-   **Run the Electron application in development mode:**
    ```bash
    npm run electron:dev
    ```

## Building for Production

To create a distributable version of the application, you can use the following scripts:

1.  **Build the Next.js application:**
    ```bash
    npm run build
    ```
2.  **Package the Electron application:**
    ```bash
    npm run dist
    ```
    This will create the distributable files in the `dist` directory.

## Project Structure

-   `app/`: Contains the core application pages and API routes.
-   `components/`: Shared React components, including UI components from shadcn/ui.
-   `lib/`: Utility functions, database connection, authentication logic, and file storage handlers.
-   `public/`: Static assets like icons.
-   `storage/`: (Generated) Directory where all user-uploaded files and submissions are stored.
-   `main.js`: The main process file for the Electron application.
-   `server.js`: The server file for running the Next.js application in production.

## Author

-   **Chy Zaber Bin Zahid** - [chy-zaber-bin-zahid](https://github.com/chy-zaber-bin-zahid)

This project was bootstrapped with [v0.dev](https://v0.dev).


Git Rebase test
