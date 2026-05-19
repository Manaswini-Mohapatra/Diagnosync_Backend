# DiagnoSync Backend

Backend server API for DiagnoSync – an AI-powered healthcare management platform that connects patients, doctors, and administrators for diagnosis, treatment, and monitoring.

The server is built with Node.js, Express, and MongoDB (via Mongoose), utilizing real JSON Web Token (JWT) authentication, email notifications (Nodemailer), Cloudinary asset uploads, and direct connection to external Machine Learning APIs for symptom checker and treatment recommendation workflows.

---

## Tech Stack

- Database: MongoDB Atlas (NoSQL database)
- Backend Framework: Express.js (Node.js framework)
- ODM: Mongoose (MongoDB object modeling)
- Authentication: JSON Web Token (JWT) with bcryptjs encryption
- Mailing: Nodemailer (SMTP transport)
- Asset Storage: Cloudinary (API-based document storage)
- Deployment/Runtime: Node.js (v14+ runtime)

---

## Environment Variables Configuration

Create a .env file in the root directory of the backend with the following keys:

```ini
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_jwt_secret_key
CORS_ORIGIN=your_frontend_url
NODE_ENV=development

# SMTP Email Settings
EMAIL_HOST=smtp_host_server
EMAIL_PORT=smtp_port_number
EMAIL_USER=smtp_username
EMAIL_PASS=smtp_password

# Cloudinary File Uploads
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# External ML Services
SYMPTOM_API_URL=external_symptom_prediction_api_endpoint
TREATMENT_API_URL=external_treatment_recommendations_api_endpoint
```

---

## Project Structure

```
Diagnosync_Backend/
├── src/
│   ├── config/       - System and service configurations (Cloudinary, etc.)
│   ├── controllers/  - Business logic handlers for all API requests
│   ├── database/     - MongoDB connection setup and lifecycle listeners
│   ├── middleware/   - JWT auth, CORS headers, multer file upload, logging, and error handling
│   ├── models/       - Mongoose schema definitions for database collections
│   ├── routes/       - Express endpoints mapping URLs to controllers
│   ├── utils/        - Helper utilities (token generation, password strength checks, email dispatch)
│   └── server.js     - Main application entrypoint
├── .env              - Environment variables
├── package.json      - Dependency list and project scripts
└── README.md         - Documentation
```

---

## API Endpoints

### Authentication
- POST /api/auth/register - Sign up a new patient or doctor account
- POST /api/auth/login - Validate login credentials and issue JWT tokens
- GET /api/auth/me - Retrieve current logged-in user profile details
- POST /api/auth/refresh - Refresh expired access tokens
- POST /api/auth/forgot-password - Generate password reset token and email it to the user
- POST /api/auth/reset-password - Verify reset token and update user password

### Patients
- GET /api/patients/me - Get logged-in patient's full medical profile
- PUT /api/patients/me - Update logged-in patient's profile data
- POST /api/patients/me/reports - Upload lab/diagnostic reports to Cloudinary
- DELETE /api/patients/me/reports/:reportId - Remove an uploaded medical report
- GET /api/patients - Get list of all patients (Doctors and Admins only)
- GET /api/patients/:id - Retrieve medical history of a specific patient (Doctors and Admins only)

### Doctors
- GET /api/doctors - Fetch verified doctor list and available specialties
- GET /api/doctors/me - Get logged-in doctor's professional profile
- PUT /api/doctors/me - Update logged-in doctor's specialties, clinic info, or availability schedule
- POST /api/doctors/me/documents - Upload verification files (licenses, degrees) to Cloudinary
- DELETE /api/doctors/me/documents/:docId - Delete an uploaded credential document
- GET /api/doctors/:id - Retrieve a specific doctor's public profile
- GET /api/doctors/:id/slots - Get available time slots for a doctor on a specific date
- PATCH /api/doctors/:id/verify - Approve or reject doctor credentials (Admin only)

### Appointments
- POST /api/appointments - Book a new appointment slot
- GET /api/appointments/patient - Retrieve appointments list for the logged-in patient
- GET /api/appointments/doctor - Retrieve appointments list for the logged-in doctor
- GET /api/appointments/:id - Retrieve specific appointment information
- PATCH /api/appointments/:id/status - Update appointment status (scheduled, completed, cancelled)
- POST /api/appointments/:id/rate - Review and rate a completed appointment (Patient only)
- GET /api/appointments - Fetch all appointments system-wide (Admin only)
- DELETE /api/appointments/:id - Cancel/remove appointment globally (Admin only)

### AI and Machine Learning Services
- POST /api/ml/session - Start a new diagnostic symptom session
- POST /api/ml/chat - Dispatch symptoms input to the chatbot engine
- POST /api/ml/treatment - Retrieve recommended treatment plan matching a predicted condition
- GET /api/ml/history/chat - Retrieve past chat session history logs
- GET /api/ml/history/treatment - Retrieve historical treatment recommendation cards

### Drug Interaction Checker
- POST /api/interactions/check - Analyze selected medications to flag dangerous contraindications (Doctors and Admins only)

### Medications List
- GET /api/medications - Live autocomplete query search for drug titles

### Prescriptions
- POST /api/prescriptions - Create and sign a prescription (Doctor only)
- GET /api/prescriptions/patient - View active and discontinued prescriptions list (Patient only)
- GET /api/prescriptions/:id - Retrieve a specific prescription's detail card
- PATCH /api/prescriptions/:id/status - Update prescription status (active, completed, discontinued) (Doctor only)

### Health Metrics
- POST /api/health-metrics - Log new vital signs data (blood pressure, blood glucose, temperature)
- GET /api/health-metrics/patient/:patientId - Fetch vitals history list
- GET /api/health-metrics/patient/:patientId/latest - Retrieve most recent logged vitals card
- GET /api/health-metrics/patient/:patientId/summary - Fetch calculated biometric statistics

### System Logs and Analytics
- GET /api/analytics/doctor - Fetch consultation statistics and performance stats (Doctor only)
- GET /api/analytics/admin - Fetch platform totals, active session counters, and log metrics (Admin only)

### Notifications
- GET /api/notifications - Retrieve user notification list
- GET /api/notifications/unread-count - Fetch number of unread alerts
- PATCH /api/notifications/:id/read - Mark alert notification as read
- DELETE /api/notifications/:id - Remove notification from logs

---

## Installation & Setup

### Step 1: Clone the Repository
Navigate to the backend project folder:
```bash
cd Diagnosync_Backend
```

### Step 2: Install Dependencies
Install all package dependencies:
```bash
npm install
```

### Step 3: Run the Server
For local development with automatic server restarts (nodemon):
```bash
npm run dev
```

For production deployment:
```bash
npm start
```

The server will initialize and begin listening for API requests on the port specified in your configuration (defaults to `http://localhost:5000`).

---

## License

This is a student project for educational purposes.

Version: 2.0.0
Last Updated: May 2026
