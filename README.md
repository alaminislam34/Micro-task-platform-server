# Micro Task Earning Platform

## Description

This is a micro-tasking and earning platform, inspired by sites like Picoworkers, Clickworker, and SEOClerks. Users can take on tasks, earn coins, and withdraw payments. The platform includes three roles: Worker, Buyer, and Admin.

## Features

- **Worker**: Complete tasks, submit for review, withdraw coins, and receive notifications.
- **Buyer**: Create tasks, review submissions, make payments, purchase coins, and report issues.
- **Admin**: Manage user roles, handle reports, and maintain the system.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Programming-Hero-Web-Course4/b10a12-server-side-alaminislam34.git
   ```

2. Navigate to the project folder:

   ```bash
   cd your-repo-name
   ```

3. Install the required dependencies:

   ```bash
   npm install mongodb dotenv nodemon express stripe jwt
   ```

4. Configure the environment variables:

   - Create a `.env` file and set the following variables:
     ```bash
     DB_USER=your_username
     DB_PASS=your_pass
     JWT_SECRET=your-secret-key
     STRIPE_SECRET_KEY=stripe_secret_key
     ```

5. Run the server:
   ```bash
   npm start
   ```

### Usage

- **Workers**: Once logged in, workers can view available tasks, complete them, and withdraw earnings.
- **Buyers**: Buyers can create new tasks, review worker submissions, and make payments.
- **Admins**: Admins can manage users, oversee task submissions, and ensure smooth platform operation.

## API Endpoints

### `GET /allUsers`

- **Description**: Fetches all users based on their role (e.g., "Worker").
- **Query Parameters**:
  - `role`: Specify the role (e.g., "Worker").
- **Response**:
  ```json
  [
    {
      "id": "12345",
      "name": "John Doe",
      "role": "Worker",
      "status": "Active"
    }
  ]
  ```
