# DEMO CREDIT PRODUCT ROADMAP

An optimized product roadmap to build and deliver this wallet service API. It is broken down into phases, ensuring each step builds on the last while keeping the process structured and manageable. This roadmap prioritizes essential features first, while also preparing for scalable enhancements.

---

### **Phase 1: Project Setup and Initial Infrastructure**  
**Goal**: Set up the project structure, establish foundational configurations, and ensure all dependencies are in place.

1. **Set Up Repository and Development Environment**
   - Create the GitHub repository with an initial commit and set up branches for development and main.
   - Define the project structure using a modular, NestJS-inspired folder layout.
   - Add environment variables (e.g., for database connections) and install essential packages (`express`, `knex`, `mysql`, `dotenv`, etc.).

2. **Initialize Knex and MySQL Database**
   - Configure Knex.js for migrations and seed files.
   - Create initial migration files for database schema.
   - Set up base tables (`User`, `Wallet`, `Transaction`) with foreign key relationships.

3. **Implement Basic Configurations**
   - Set up environment configuration management (`dotenv` for local, environment variables for cloud).
   - Create a `README` with setup instructions for the development environment.

---

### **Phase 2: Core User and Wallet Functionality**  
**Goal**: Develop the primary user and wallet functionalities, ensuring new users can be onboarded and wallets are created and funded.

1. **User Module**
   - **Onboard User**: Implement `POST /users` to onboard new users.
   - **Blacklist Check**: Integrate with the Adjutor Karma API to validate users before onboarding.
   - **Unit Tests**: Write tests for user onboarding and blacklist validation.

2. **Wallet Creation and Funding**
   - **Wallet Creation**: Automatically generate a wallet upon user onboarding with a balance of zero.
   - **Fund Wallet**: Implement `POST /wallets/fund` to allow users to fund their wallet.
   - **Transaction Scoping**: Use transaction management for wallet funding to maintain data consistency.
   - **Unit Tests**: Cover wallet creation and funding features with tests for positive and negative cases.

3. **Transaction Model and Interface**
   - Define the `Transaction` model and implement initial funding as a transaction record.
   - Set up types and interfaces for transaction types.

---

### **Phase 3: Wallet Transfers and Withdrawals**  
**Goal**: Implement peer-to-peer transfers and wallet withdrawals, focusing on transaction integrity and error handling.

1. **Fund Transfer**
   - **Transfer Funds**: Create `POST /wallets/transfer` to handle user-to-user transfers.
   - **Validation**: Ensure sufficient funds and check for the existence of both users.
   - **Transaction Handling**: Scope the transfer action within a database transaction for atomicity.
   - **Tests**: Write unit tests covering transfer success, insufficient funds, and invalid user cases.

2. **Fund Withdrawal**
   - **Withdrawal Implementation**: Develop `POST /wallets/withdraw` to allow users to withdraw funds.
   - **Balance Check**: Validate the wallet balance before processing any withdrawal.
   - **Transaction Management**: Scope the withdrawal process to prevent data inconsistency.
   - **Tests**: Test cases for successful withdrawals, insufficient balance, and invalid inputs.

---

### **Phase 4: Additional Features and Optimizations**  
**Goal**: Build supportive endpoints for user experience and system reliability, focusing on transaction history, health checks, and database optimization.

1. **Transaction History**
   - **Endpoint**: Implement `GET /wallets/transactions` for retrieving a user’s transaction history.
   - **Pagination**: Add pagination to handle large histories efficiently.
   - **Tests**: Validate pagination, filter by date, and retrieve transaction types.

2. **Balance Inquiry**
   - **Balance Endpoint**: Develop `GET /wallets/balance` to check wallet balance.
   - **Tests**: Ensure correct balance retrieval for different user scenarios.

3. **Health Check Endpoint**
   - **Health Endpoint**: Implement `GET /health` for basic API health monitoring.
   - **Tests**: Add tests to confirm the endpoint responds appropriately.

4. **List Endpoints with Search and Pagination** ✅ **COMPLETED**
   - **Users List**: Implement `GET /users` with search and pagination for user management.
   - **Wallets List**: Implement `GET /wallet` with search and pagination for wallet overview.
   - **Search Functionality**: Add search across user names, emails, and wallet IDs.
   - **Pagination**: Efficient handling of large datasets with configurable page sizes.

---

### **Phase 5: Final Touches and Deployment Preparation**  
**Goal**: Polish the API with documentation, testing, and deployment to a cloud environment. Ensure a smooth deployment and reliable user experience.

1. **API Documentation**
   - **README**: Document API usage, including setup, endpoints, and expected responses.
   - **ER Diagram**: Add an ER diagram to the README, showing database relationships.

2. **Comprehensive Testing**
   - **Integration Tests**: Create tests that span multiple modules (e.g., onboarding + wallet funding).
   - **End-to-End Tests**: Verify full user flows, from onboarding to wallet funding and transactions.
   - **Edge Case Handling**: Test edge cases, such as maximum and minimum amounts, invalid users, and concurrent transfers.

3. **Deployment**
   - **Environment Configuration**: Ensure production-ready environment variables are configured.
   - **Deploy to Heroku (or other cloud provider)**: Deploy the API to a cloud environment, using the required URL structure (e.g., `https://<candidate-name>-lendsqr-be-test.<cloud-platform-domain>`).
   - **Verify Deployment**: Test the deployed API to ensure it functions as expected.

4. **Submission Preparation**
   - **Video Walkthrough**: Record a 3-minute Loom video explaining key aspects of the project and demonstrating core functionalities.
   - **Submit Documentation**: Prepare the documentation link with the repository URL, live API URL, and Loom video.

---

### **Phase 6: Post-Submission Optimizations (If Time Permits)**  
**Goal**: Implement additional enhancements to showcase extra skills and boost performance.

1. **Performance Optimizations**
   - Optimize database queries (e.g., by indexing frequently queried fields like `userId`).
   - Consider caching frequently requested endpoints if applicable, such as the `GET /wallets/balance`.

2. **Code Quality Improvements**
   - Refactor any complex code to simplify logic and improve readability.
   - Review and improve logging for better traceability in production.

---

### **Timeline Estimate**

| Phase                              | Estimated Time |
|------------------------------------|----------------|
| Phase 1: Project Setup             | 1 day         |
| Phase 2: Core User & Wallet        | 1-2 days      |
| Phase 3: Transfers & Withdrawals   | 2 days        |
| Phase 4: Additional Features       | 1-2 days      |
| Phase 5: Final Touches & Deployment| 1-2 days      |
| **Total**                          | 6-9 days      |

This roadmap ensures that we address each requirement efficiently, balancing core functionality with code quality, scalability, and deployment readiness. 🚀
