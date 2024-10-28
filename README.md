# Demo Credit Wallet Service API

## Table of Contents
- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup and Installation](#setup-and-installation)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Deployment](#deployment)
- [Design Decisions](#design-decisions)

---

## Project Overview

The Demo Credit Wallet Service API is a backend application designed to provide wallet functionality for a lending application. This service allows users to create accounts, manage wallets, fund and withdraw from wallets, and transfer funds between users. The project also integrates with the Adjutor Karma blacklist API to prevent blacklisted users from onboarding.

This API is built with Node.js and TypeScript, following 12-factor app principles to ensure scalability, maintainability, and adherence to industry best practices.

---

## Tech Stack

- **Node.js (LTS)** - Backend runtime
- **TypeScript** - Static typing for maintainability
- **Express** - HTTP server for routing and middleware management
- **Knex.js** - SQL query builder and ORM for database operations
- **MySQL** - Relational database
- **Faker.js** - Generating realistic seed data for testing
- **Jest** - Testing framework for unit and integration tests

---

## Project Structure

The project follows a modular, feature-based structure inspired by NestJS, ensuring each feature (module) has its own controller, service, and model. Common utilities and configurations are managed separately to enable reusability and scalability.

```plaintext
├── src
│   ├── config                   # Configuration files for environment variables and Swagger
│   │   ├── env.config.ts        # Loads environment variables for the application
│   │   └── swagger.config.ts    # Configures Swagger documentation setup
│   ├── middleware               # Custom middleware for request handling (e.g., error handling)
│   ├── migrations               # Knex migration files to define database schema
│   │   ├── create_users_table.ts         # Migration for creating the `users` table
│   │   ├── create_wallets_table.ts       # Migration for creating the `wallets` table
│   │   └── create_transactions_table.ts  # Migration for creating the `transactions` table
│   ├── modules                  # Modular structure for core features, each feature has its own directory
│   │   ├── health               # Health module to handle API health check
│   │   │   └── health.controller.ts  # Health check route definition
│   │   ├── transaction          # Transaction module for handling fund transfers and records
│   │   ├── users                # User module for user-related logic, models, and routes
│   │   └── wallet               # Wallet module for wallet creation, funding, and balance management
│   ├── seeds                    # Seeder files for populating the database with test data
│   │   ├── seed_users.ts        # Seeds initial users into the database
│   │   └── seed_wallets.ts      # Seeds initial wallets linked to users
│   ├── tests                    # Test files for unit and integration tests
│   ├── utils                    # Utility functions and helpers
│   ├── app.ts                   # Main app configuration and middleware setup
│   └── server.ts                # Server bootstrap file, initializing and starting the Express app
├── knexfile.ts                  # Knex configuration for database connection and migrations
├── LICENSE                      # Project license
├── package.json                 # NPM dependencies and scripts
├── package-lock.json            # Locked versions of NPM dependencies
├── README.md                    # Project documentation (this file)
├── roadmap.md                   # Roadmap for development phases and milestones
├── tsconfig.json                # TypeScript configuration
└── .env                         # Environment variables file (ignored in version control)
└── .env.sample                  # Sample environment file to guide developers on required variables
```

### Key Directories and Files

- **src/config**: Holds configuration files for setting up environment variables and Swagger documentation.
- **src/middleware**: Custom middleware for tasks like error handling and request validation.
- **src/migrations**: Database migrations managed by Knex.js, creating the necessary tables for `users`, `wallets`, and `transactions`.
- **src/modules**: Organized by feature, with each module encapsulating its own controllers, services, and models. This modular structure keeps the codebase clean and scalable.
  - **health**: Contains a health check endpoint for monitoring API status.
  - **transaction**: Handles all transaction-related operations, including transfers and transaction history.
  - **users**: Manages user-related operations like onboarding and validation.
  - **wallet**: Manages wallet operations such as creating wallets, funding, and balance checking.
- **src/seeds**: Seeder files for generating initial data to test the application in development environments.
- **tests**: Includes unit and integration tests to ensure API reliability.
- **app.ts**: Main app setup, defining middleware and routing.
- **server.ts**: Initializes and starts the Express server, applying the route prefix `/api`.

This structure ensures a scalable and maintainable architecture for developing a feature-rich API.
---

## Setup and Installation

### Prerequisites

- **Node.js** (version 14 or above)
- **MySQL** installed and running

### Environment Variables

Create a `.env` file at the root of the project:

```plaintext
# .env
PORT=3000
DATABASE_URL=mysql://<username>:<password>@localhost:3306/demo_credit
DATABASE_HOST=your_db_host
DATABASE_PORT=your_db_port
DATABASE_USER=your_db_user
DATABASE_PASSWORD=your_db_password
DATABASE_NAME=your_db_name
ADJUTOR_API_KEY=your_adjutor_api_key
```

### Steps to Install and Run

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/LexxLuey/demo-credit.git
   cd demo-credit
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Database**:
   - Ensure MySQL is running and create a database named `demo_credit`.
   - Run migrations to create tables:
     ```bash
     npx knex migrate:latest --knexfile knexfile.ts
     ```

4. **Seed Database**:
   - Populate the database with dummy data for testing:
     ```bash
     npx knex seed:run --knexfile knexfile.ts
     ```

5. **Run the Application**:
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:3000`.

---

## Database Schema

The database schema consists of three main tables: `users`, `wallets`, and `transactions`.

![ER Diagram](https://link-to-er-diagram)

1. **Users**: Stores user information.
   - **Fields**: `id`, `name`, `email`, `created_at`, `updated_at`
2. **Wallets**: Tracks each user’s wallet and balance.
   - **Fields**: `id`, `user_id` (foreign key), `balance`, `created_at`, `updated_at`
3. **Transactions**: Records all transactions, including fund, transfer, and withdrawal.
   - **Fields**: `id`, `wallet_id`, `type`, `amount`, `target_wallet_id`, `created_at`

---

## API Documentation

Swagger documentation for this API is available at `/api/docs`.

- **URL**: `http://localhost:3000/api/docs`
- This provides detailed information on each API endpoint, including request parameters, response formats, and example payloads.


## API Endpoints

### Health Check
- **GET `/health`**: Checks API health status.

### User and Wallet Operations

1. **User Onboarding**
   - **POST `/users`**: Creates a new user, ensuring the user is not blacklisted via Adjutor Karma API.
   - **Request**: `{ "name": "John Doe", "email": "john@example.com" }`

2. **Fund Wallet**
   - **POST `/wallets/fund`**: Adds funds to a user’s wallet.
   - **Request**: `{ "walletId": "<wallet-id>", "amount": 1000 }`

3. **Transfer Funds**
   - **POST `/wallets/transfer`**: Transfers funds between users.
   - **Request**: `{ "senderWalletId": "<wallet-id>", "receiverWalletId": "<wallet-id>", "amount": 200 }`

4. **Withdraw Funds**
   - **POST `/wallets/withdraw`**: Withdraws funds from a user’s wallet.
   - **Request**: `{ "walletId": "<wallet-id>", "amount": 500 }`

5. **Transaction History**
   - **GET `/wallets/transactions?walletId=<wallet-id>&page=1&limit=10`**: Retrieves transaction history for a user’s wallet.

6. **Check Balance**
   - **GET `/wallets/balance?walletId=<wallet-id>`**: Returns the current wallet balance.

---

## Testing

The application includes unit and integration tests to ensure functionality and robustness.

### Run Tests

To run tests, use the following command:
```bash
npm test
```

### Testing Scenarios

- **Positive Test Cases**: Ensure all endpoints work as expected with valid data.
- **Negative Test Cases**: Test edge cases such as insufficient funds, invalid IDs, and blacklisted users.

---

## Deployment

1. **Hosting Platform**: The application can be deployed on Heroku or any other cloud provider.
2. **Build for Production**:
   ```bash
   npm run build
   ```
3. **Deploy URL Structure**: Deploy using the URL format `https://<candidate-name>-lendsqr-be-test.<cloud-domain>`.

---

## Design Decisions

1. **Modular Structure**: Following NestJS-inspired modular structure keeps each feature (user, wallet, transaction) encapsulated, ensuring maintainability and scalability.
2. **12-Factor Principles**: Adhered to 12-factor app principles for environment configuration, logging, and database handling.
3. **Transaction Handling**: Used Knex transaction scoping to handle fund transfers and withdrawals atomically, ensuring data consistency.
4. **Error Handling**: Implemented centralized error handling with custom middleware, providing meaningful error responses for client requests.
5. **Adjutor Karma Blacklist API**: Integrated Adjutor Karma API during user onboarding to prevent blacklisted users from accessing the service.

---

## Acknowledgments

This project was developed as part of an assessment for a backend engineering role at Lendsqr. It demonstrates core competencies in TypeScript, Node.js, MySQL, and scalable backend architecture practices.