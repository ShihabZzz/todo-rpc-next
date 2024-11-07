
## Todo
## Getting Started

### Prerequisites

- Node.js
- npm 
- Turso SQLite

### Installation

1. Clone the repository

2. Install the dependencies:
    ```sh
    npm install
    ```

3. Create a `.env` file in the project root folder with the following content:
    ```sh
    NEXT_PUBLIC_API_PORT=
    TURSO_DATABASE_URL=
    TURSO_AUTH_TOKEN=
    ```

4. Start both (Hono API & Next.JS) server:
    ```sh
    npm run dev:all
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.