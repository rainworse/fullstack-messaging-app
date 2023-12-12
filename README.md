# Messenger Clone

Welcome to Messenger Clone, a project that replicates the look and feel of Facebook Messenger. This project serves as a portfolio demonstration of my skills using React, MaterialUI for the frontend, and ExpressJs with MongoDB for the backend.

## Features

- **Real-time Messaging**: Experience seamless real-time messaging just like in Facebook Messenger.
- **User Authentication**: Securely sign in and authenticate users for a personalized experience.
- **Responsive Design**: Enjoy a consistent and user-friendly experience across various devices.

## Tech Stack

### Frontend
- **React**: A JavaScript library for building user interfaces.
- **MaterialUI**: React components that implement Google's Material Design.

### Backend
- **ExpressJs**: A minimal and flexible Node.js web application framework.
- **MongoDB**: A NoSQL database for storing user data and messages.

## Getting Started

Follow these steps to set up the project on your local machine:

1. **Clone the Repository**
   ```bash
   git@github.com:rainworse/messenger-clone.git
   ```

2. **Install Dependencies**
   ```bash
   cd messenger-clone
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the server directory and add the following variables:
   ```env
   MONGODB= *** Your MongoDB connection URL ***
   TOKEN_KEY= *** Private key used for user encryption/decryption ***
   ```

4. **Run the Application**

   - To start the backend server, navigate to the server directory and run the following command:
     ```bash
     cd server
     npm run start
     ```

   - To launch the frontend, navigate to the frontend directory and execute the following command:
     ```bash
     cd frontend
     npm run dev
     ```

5. **Open in Browser**
   Visit `http://localhost:5173` in your browser to explore the Messenger Clone.
