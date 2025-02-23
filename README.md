# Workflow Earning Platform Server

## Introduction

The **Workflow Earning Platform Server** is the backend service for the micro-task earning application. It is built using **Node.js and Express**, with **MongoDB** as the database and **Stripe** for payment processing.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [API Endpoints](#api-endpoints)
- [Development](#development)
- [License](#license)

## Installation

To set up the server locally, follow these steps:

1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo/workflow-earning-platform-server.git
   cd workflow-earning-platform-server
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file in the root directory and add the required environment variables (see [Environment Variables](#environment-variables) section).
4. Start the server:
   ```sh
   npm start
   ```

## Usage

- The server handles user authentication and authorization.
- It connects to a MongoDB database to store and retrieve user and task data.
- It processes payments using **Stripe**.
- The API endpoints allow clients (frontend applications) to interact with the platform.

## Features

✅ RESTful API using **Express.js**  
✅ Authentication with **JWT**  
✅ Database management with **MongoDB**  
✅ Secure payment handling with **Stripe**  
✅ CORS support for frontend integration

## Environment Variables

Create a `.env` file and add the following:

```env
DB_USER=YOUR_DATABASE_USERNAME
DB_PASS=YOUR_DATABASE_PASSWORD
SECRET_ACCESS_TOKEN=YOUR_SECRET_ACCESS_TOKEN
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
```

**Note:** Replace values with actual credentials before running the server.

## Dependencies

The project uses the following major dependencies:

- **Express** (`^4.21.2`) - Web framework
- **MongoDB** (`^6.12.0`) - Database client
- **JWT (jsonwebtoken)** (`^9.0.2`) - Authentication
- **CORS** (`^2.8.5`) - Cross-origin requests
- **dotenv** (`^16.4.7`) - Environment variables
- **Stripe** (`^17.5.0`) - Payment processing

## API Endpoints

| Method | Endpoint     | Description                  |
| ------ | ------------ | ---------------------------- |
| POST   | `/login`     | User login                   |
| POST   | `/register`  | User registration            |
| GET    | `/tasks`     | Fetch all tasks              |
| POST   | `/tasks`     | Create a new task            |
| DELETE | `/tasks/:id` | Delete a task                |
| POST   | `/payment`   | Process a payment via Stripe |

## Development

Run the server with **nodemon** for hot reloading:

```sh
npm run dev
```

## License

This project is **private** and not open-source.
