# 🏥 DiagnoSync Backend

Backend server for **DiagnoSync** – an AI-powered healthcare management platform that connects patients, doctors, and admins for seamless diagnosis, treatment, and monitoring.

---

## 🚀 Tech Stack

- MongoDB – Database
- Express.js – Backend framework
- Node.js – Runtime environment
- Mongoose – ODM for MongoDB
- JWT – Authentication
- REST API – Communication layer

---

## 📌 Features

- 👤 User Authentication (Patient, Doctor, Admin)
- 🩺 Symptom Checker & Analysis
- 📅 Appointment Scheduling
- 💊 Prescription Management
- 🔔 Health Alerts & Notifications
- 📊 Doctor Dashboard
- 📁 Patient Records Management
- 🤖 NLP-based Treatment Recommendation (planned/integration)

---

## 📁 Project Structure
Diagnosync_Backend/
│── controllers/
│── models/
│── routes/
│── middleware/
│── config/
│── utils/
│── .env
│── server.js
│── package.json


---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/Manaswini-Mohapatra/Diagnosync_Backend.git
cd Diagnosync_Backend

npm install

🔗 API Endpoints (Example)
Method	Endpoint	Description
POST	/api/auth/register	Register user
POST	/api/auth/login	Login user
GET	/api/patients	Get patient data
POST	/api/appointments	Book appointment
🔐 Authentication
JWT-based authentication
Role-based access (Admin / Doctor / Patient)
🌐 Future Enhancements
🧠 AI/NLP Symptom Checker
📹 Video Consultation (WebRTC)
📊 Advanced Analytics Dashboard
🔄 Real-time Notifications
👥 Contributors
Your Team Members (Add names here)
📄 License

This project is for academic and development purposes.


---

# 📤 6. Push README to GitHub

```bash
git add README.md
git commit -m "Added README for backend"
git push origin main