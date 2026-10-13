# MedTrack – Frontend

## About the Project

MedTrack is a healthcare management application designed to help users manage medicine-related information through a user-friendly interface.

The project consists of two main parts:

- **Frontend:** Developed using React.js, JavaScript, and CSS to provide the user interface.
- **Backend:** Developed using Java and Spring Boot to handle application logic and data operations, with MySQL for data storage.

The frontend communicates with the backend through API requests to exchange data and perform application operations.

## Frontend Features

- Interactive and user-friendly interface
- Medicine management interface
- Prescription management interface
- Medicine reminders interface
- Pharmacy locator interface
- Login and registration interfaces
- Reusable React components
- CSS-based styling

## Technologies Used

- React.js
- JavaScript
- CSS
- Vite
- ESLint

## Project Structure

```text
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   └── Navbar.jsx
│   ├── pages/
│   │   ├── Medicines.jsx
│   │   ├── Prescriptions.jsx
│   │   ├── Reminders.jsx
│   │   └── PharmacyLocator.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── Login.jsx
│   ├── Login.css
│   ├── Register.jsx
│   ├── Register.css
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── package-lock.json
├── eslint.config.js
├── vite.config.js
└── README.md
```

## How to Run

**Prerequisites:** Node.js and npm.

1. Open a terminal in the frontend directory.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the local URL displayed in the terminal.

## Frontend and Backend Integration

The React frontend sends requests to the Spring Boot backend API. The backend processes these requests and interacts with the MySQL database when required, returning responses to the frontend.

## Purpose

The frontend aims to provide a clear, accessible, and user-friendly interface for the MedTrack healthcare management application.

---

## Author

**Vadla Sai Nikhil**  
Anurag University  
Roll No: 25EG504D07
B.Tech – ECE-D, 3rd Year
Project documentation for the MedTrack frontend.
