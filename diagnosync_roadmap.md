# DiagnoSync — Backend Roadmap & Frontend Integration Report

---

## 🗺️ Backend Build Roadmap

### Phase 1 — Foundation ✅ DONE
Everything needed to start the server is now in place.

| File | Status |
|---|---|
| `config/env.js` | ✅ Written |
| `config/database.js` | ✅ Written |
| `config/constants.js` | ✅ Written |
| `database/connection.js` | ✅ Written |
| `middleware/corsMiddleware.js` | ✅ Written |
| `utils/tokenUtils.js` | ✅ Written |
| All Models | ✅ Written (User, Patient, Doctor, Appointment, Prescription, Symptom, Condition, Medication, DrugInteraction, Treatment, HealthMetrics, Notification) |
| `utils/passwordUtils.js` | ✅ Written |

---

### Phase 2 — Auth & Users (Build This Next)
> **Why first?** Every other feature depends on a logged-in user with a real `userId`.

#### Files to write:
- `middleware/authMiddleware.js` — verify JWT, attach `req.user`
- `middleware/errorHandler.js` — global Express error handler
- `middleware/validation.js` — request body validators using `express-validator` (install it)
- `controllers/authController.js` — `register`, `login`, `logout`, `refreshToken`, `forgotPassword`
- `controllers/userController.js` — `getMe`, `updateMe`, `deleteMe`
- `routes/authRoutes.js` — `POST /register`, `POST /login`, `POST /refresh`, `POST /forgot-password`
- `routes/userRoutes.js` — `GET /me`, `PUT /me`

#### Install needed:
```bash
npm install express-validator
```

---

### Phase 3 — Patient & Doctor Profiles
> **Why second?** After auth, patients and doctors need their extended profiles created.

#### Files to write:
- `controllers/patientController.js` — CRUD for Patient profile, health metrics
- `controllers/doctorController.js` — CRUD for Doctor profile, availability slots
- `routes/patientRoutes.js`
- `routes/doctorRoutes.js`

---

### Phase 4 — Core Healthcare Features
> Build these in parallel once profiles are stable.

#### 4a — Appointments
- `controllers/appointmentController.js` — book, cancel, reschedule, list by patient/doctor
- `routes/appointmentRoutes.js`

#### 4b — Prescriptions
- `controllers/prescriptionController.js` — create (doctor only), view (patient/doctor)
- `routes/prescriptionRoutes.js`

#### 4c — Drug Interaction Checker
- `utils/drugInteractionChecker.js` — already written (check it), may need updates
- `controllers/drugInteractionController.js` — check interaction endpoint
- `routes/drugInteractionRoutes.js`

#### 4d — Treatments
- `controllers/treatmentController.js`
- `routes/treatmentRoutes.js`

#### 4e — Notifications
- `controllers/notificationController.js`
- `routes/notificationRoutes.js`
- `utils/emailService.js` — already written, needs real SMTP credentials in `.env`

#### 4f — Health Metrics
- `controllers/healthMetricsController.js`

---

### Phase 5 — NLP / ML (Skip for Now, Stub It)
- Write `nlpRoutes.js` and `mlRoutes.js` as stubs returning `501 Not Implemented`
- This prevents `server.js` from crashing since it already imports these routes

---

### Phase 6 — Testing & Polish
- Test all endpoints with Postman
- Add pagination to list endpoints (use `PAGINATION` constants)
- Add `helmet` for security headers
- Add `express-rate-limit` for rate limiting auth routes

```bash
npm install helmet express-rate-limit
```

---

## 🔗 Frontend Integration Audit

### Critical Missing Infrastructure

> [!IMPORTANT]
> The frontend has **zero API integration**. All data is currently hardcoded mock data. Before touching individual pages, you need to create these 2 shared files first.

#### ① Create `src/utils/api.js` (Axios instance)
```js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/signin';
    }
    return Promise.reject(err);
  }
);

export default api;
```

#### ② Add `VITE_API_URL` to frontend `.env`
Create `diagnosync-frontend/healthcare-system-mvp/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

#### ③ Add Vite proxy (optional but cleaner for dev)
Update `vite.config.js` to add a proxy so you avoid CORS in dev:
```js
server: {
  port: 3000,
  proxy: {
    '/api': 'http://localhost:5000'
  }
}
```

---

### Per-Page Integration Changes

#### `App.jsx` — Auth State
| Current | Required Change |
|---|---|
| `isAuthenticated` stored as string `"true"` in localStorage | Store JWT `token` instead of a boolean flag |
| `currentUser` is a mock object with `id: Date.now()` | Should come from the API response (`/api/auth/login`) |
| `handleLogin` is purely local state | Must call `api.post('/auth/login')`, save token, save user from response |
| `handleLogout` just clears localStorage | Should also call `api.post('/auth/logout')` to invalidate server session |

---

#### `SignIn.jsx` 🔴 CRITICAL
| Current | Required Change |
|---|---|
| `handleSubmit` just creates a fake user object | Call `api.post('/auth/login', { email, password, role })` |
| **No loading/error state** | Add `isLoading` and `apiError` states |
| Demo credentials section | Remove or make it dev-only |
| No token storage | Save `token` from response to localStorage |

```js
// Replace the mock submit with:
const res = await api.post('/auth/login', formData);
localStorage.setItem('token', res.data.token);
onLogin(res.data.user.role, res.data.user);
```

---

#### `SignUp.jsx` 🔴 CRITICAL
| Current | Required Change |
|---|---|
| `handleSubmit` creates local user object | Call `api.post('/auth/register', formData)` |
| No loading/error state | Add `isLoading` and `apiError` |
| After signup → immediately logs in | Backend should return token on register too |

---

#### `PatientDashboard.jsx` 🟡 MEDIUM
| Current | Required Change |
|---|---|
| Stats (2 appointments, 5 prescriptions, Health Score 85) are hardcoded | Fetch from `GET /api/appointments?status=upcoming`, `GET /api/prescriptions?status=active` |
| Upcoming appointments are hardcoded (Dr. Sarah Johnson, Dr. Michael Chen) | Fetch from `GET /api/appointments?patientId={id}&limit=2` |
| Health alerts are hardcoded | Fetch from `GET /api/notifications?userId={id}` |

---

#### `AppointmentBooking.jsx` 🔴 CRITICAL
| Current | Required Change |
|---|---|
| `doctors` array is hardcoded (3 mock doctors) | Fetch from `GET /api/doctors` |
| `timeSlots` are hardcoded | Fetch from `GET /api/doctors/{id}/slots?date={date}` (from doctor's `availableSlots`) |
| `handleConfirmAppointment` just sets state | Call `api.post('/api/appointments', { doctorId, date, time, type, reason })` |
| Confirmation says "email sent" but no email is sent | Backend will send via `emailService.js` after appointment created |

---

#### `DrugInteractionChecker.jsx` 🔴 CRITICAL
| Current | Required Change |
|---|---|
| `mockDrugDatabase` is a hardcoded array of 10 drugs | Fetch from `GET /api/medications?search={query}` |
| `interactions` array is hardcoded | Call `api.post('/api/interactions/check', { drugs: selectedDrugs })` |
| `checkInteractions` just shows static results | Replace with real API call, handle loading/error states |

---

#### `DoctorDashboard.jsx` 🟡 MEDIUM
- Stats (patients today, upcoming appointments) are likely hardcoded — replace with API calls
- `GET /api/appointments?doctorId={id}&date=today`

---

#### `PatientList.jsx` 🔴 CRITICAL
- Doctor's patient list is almost certainly mock data — replace with `GET /api/patients?doctorId={id}`

---

#### `PrescriptionPage.jsx` 🔴 CRITICAL
- Prescriptions likely mock — replace with `GET /api/prescriptions?patientId={id}`
- For doctors creating prescriptions: `POST /api/prescriptions`

---

#### `PatientProfilePage.jsx` & `DoctorProfilePage.jsx` 🟡 MEDIUM
- Profile data uses `currentUser` from localStorage (mock object)
- Needs `GET /api/patients/me` and `GET /api/doctors/me`
- Needs `PUT /api/patients/me` and `PUT /api/doctors/me` for profile updates

---

#### `PatientRegistrationForm.jsx` & `DoctorRegistrationForm.jsx` 🟡 MEDIUM
- These forms probably save locally or do nothing — wire to `PUT /api/patients/me` / `PUT /api/doctors/me`

---

#### `PasswordReset.jsx` 🟡 MEDIUM
- Wire to `POST /api/auth/forgot-password` (send reset email)

---

#### `SymptomChecker.jsx` 🟢 LOW (NLP not ready)
- Keep mock/stub for now
- Future: `POST /api/nlp/analyze`

---

#### `TreatmentRecommendations.jsx` 🟢 LOW (ML not ready)
- Keep mock/stub for now
- Future: `POST /api/ml/recommend`

---

#### `DoctorAppointmentsPage.jsx` 🔴 CRITICAL
- Doctor's appointments view — wire to `GET /api/appointments?doctorId={id}`
- Status updates (confirm/cancel): `PATCH /api/appointments/{id}/status`

---

### Summary Table

| Page | Priority | Backend Endpoint Needed |
|---|---|---|
| `SignIn.jsx` | 🔴 Critical | `POST /auth/login` |
| `SignUp.jsx` | 🔴 Critical | `POST /auth/register` |
| `AppointmentBooking.jsx` | 🔴 Critical | `GET /doctors`, `GET /doctors/:id/slots`, `POST /appointments` |
| `DrugInteractionChecker.jsx` | 🔴 Critical | `GET /medications`, `POST /interactions/check` |
| `PatientList.jsx` | 🔴 Critical | `GET /patients` |
| `PrescriptionPage.jsx` | 🔴 Critical | `GET /prescriptions`, `POST /prescriptions` |
| `DoctorAppointmentsPage.jsx` | 🔴 Critical | `GET /appointments`, `PATCH /appointments/:id/status` |
| `PatientDashboard.jsx` | 🟡 Medium | `GET /appointments`, `GET /prescriptions`, `GET /notifications` |
| `DoctorDashboard.jsx` | 🟡 Medium | `GET /appointments` |
| `PatientProfilePage.jsx` | 🟡 Medium | `GET /patients/me`, `PUT /patients/me` |
| `DoctorProfilePage.jsx` | 🟡 Medium | `GET /doctors/me`, `PUT /doctors/me` |
| `PatientRegistrationForm.jsx` | 🟡 Medium | `PUT /patients/me` |
| `DoctorRegistrationForm.jsx` | 🟡 Medium | `PUT /doctors/me` |
| `PasswordReset.jsx` | 🟡 Medium | `POST /auth/forgot-password` |
| `SymptomChecker.jsx` | 🟢 Low | `POST /nlp/analyze` (future) |
| `TreatmentRecommendations.jsx` | 🟢 Low | `POST /ml/recommend` (future) |

---

## ⚡ Recommended Order of Work

```
1. Backend Phase 2 (Auth) → Test with Postman
2. Frontend: Create api.js + .env + update SignIn + SignUp
3. Backend Phase 3 (Patient/Doctor profiles)
4. Frontend: Wire PatientProfilePage + DoctorProfilePage
5. Backend Phase 4a (Appointments)
6. Frontend: Wire AppointmentBooking + DoctorAppointmentsPage
7. Backend Phase 4b (Prescriptions)
8. Frontend: Wire PrescriptionPage
9. Backend Phase 4c (Drug Interactions)
10. Frontend: Wire DrugInteractionChecker
11. Backend Phase 4d-f (Treatments, Notifications, Health Metrics)
12. Frontend: Wire dashboards + notifications
13. Backend Phase 5 (NLP/ML stubs)
14. Final polish, testing, rate limiting, helmet
```
