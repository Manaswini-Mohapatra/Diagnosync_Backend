# DiagnoSync — Full Integration & Bug Fix Roadmap

> Every issue from the lacunae list is categorized below with the exact file, what to fix, and whether it needs backend or is a pure frontend fix.

---

## Legend
- 🔴 **Critical** — Blocks core functionality
- 🟡 **Medium** — Important but not blocking
- 🟢 **Low** — Polish / nice-to-have
- **[FE]** = Pure frontend fix (no backend changes needed)
- **[BE+FE]** = Needs backend wiring
- **[DEFER]** = Skip for now (needs ML/admin/infra)

---

## Phase 1 — Foundation (Must Do First)

> Nothing else works without these two files.

### 1.1 Create `src/utils/api.js` [FE] 🔴
**New file** — Axios instance with JWT interceptor and auto-logout on 401.
```js
// src/utils/api.js
import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) { localStorage.clear(); window.location.href = '/signin'; }
  return Promise.reject(err);
});
export default api;
```

### 1.2 Create frontend `.env` [FE] 🔴
**New file** — `diagnosync-frontend/healthcare-system-mvp/.env`
```
VITE_API_URL=http://localhost:5000/api
VITE_GROQ_API_KEY=your_groq_key_here
```

### 1.3 Create `src/components/NotificationBell.jsx` [BE+FE] 🔴
**New component** — Bell icon with unread count badge. Polls `GET /api/notifications/unread-count` every 30 seconds. Clicking opens a dropdown of recent notifications from `GET /api/notifications`. Add to **both** dashboards.
- Wire: `GET /api/notifications/unread-count` → badge number  
- Wire: `GET /api/notifications` → dropdown list  
- Wire: `PATCH /api/notifications/:id/read` → on click  
- Wire: `PATCH /api/notifications/all/read` → "Mark all read" button  

---

## Phase 2 — Auth Pages

### 2.1 `SignIn.jsx` [BE+FE] 🔴
**File:** `src/pages/SignIn.jsx`

| Issue | Fix |
|---|---|
| Accepts any email/password (mock auth) | Replace `handleSubmit` with `await api.post('/auth/login', {email, password})` |
| No loading/error state | Add `isLoading`, `apiError` states |
| Demo credentials section visible | Remove or hide behind `DEV` env flag |
| No token storage | `localStorage.setItem('token', res.data.token)` |
| Role comes from dropdown, not from DB | Use `res.data.user.role` from API response |

```js
// Replace handleSubmit with:
const res = await api.post('/auth/login', { email: formData.email, password: formData.password });
localStorage.setItem('token', res.data.token);
onLogin(res.data.user.role, res.data.user);
```

### 2.2 `SignUp.jsx` [BE+FE] 🔴
**File:** `src/pages/SignUp.jsx`

| Issue | Fix |
|---|---|
| Creates account without agreeing to T&C | Add `agreedToTerms` state + checkbox validation: block submit if unchecked |
| T&C link goes to homepage | Open `TermsPopup` component (already exists!) via state toggle |
| Mock account creation | Replace with `await api.post('/auth/register', formData)` |
| Password min 6 chars only | Upgrade to 8+ chars + require 1 number (matches backend validation) |

```js
// Add to validateForm():
if (!formData.agreedToTerms) newErrors.terms = 'You must agree to Terms & Conditions';
```

### 2.3 `PasswordReset.jsx` [BE+FE] 🟡
**File:** `src/pages/PasswordReset.jsx`

| Issue | Fix |
|---|---|
| Reset link not sent | Wire to `POST /api/auth/forgot-password` |
| No OTP verification step | Add step 2: enter OTP → `POST /api/auth/verify-otp` |
| No new password step | Add step 3: new password → `POST /api/auth/reset-password` |

> **Note:** OTP is already generated in `authController.js`. Email delivery needs SMTP config in `.env`.

### 2.4 `App.jsx` [BE+FE] 🔴
**File:** `src/App.jsx`

| Issue | Fix |
|---|---|
| `isAuthenticated` stored as string `"true"` | Check for presence of `token` in localStorage instead |
| `currentUser` is mock object with `id: Date.now()` | Populate from API login response (has real `_id`) |
| `handleLogout` only clears localStorage | Also call `DELETE /api/auth/logout` (or just clear token) |

---

## Phase 3 — Shared Components (Apply to All Pages)

### 3.1 Notification Bell [BE+FE] 🔴
Add `<NotificationBell />` to navbar in:
- `PatientDashboard.jsx`
- `DoctorDashboard.jsx`
- `PatientProfilePage.jsx`
- `DoctorProfilePage.jsx`
- `AppointmentBooking.jsx`
- `DoctorAppointmentsPage.jsx`

### 3.2 Logout Button Text [FE] 🟡
**File:** `DoctorDashboard.jsx` line 134
```jsx
// Change from:
<LogOut className="w-4 h-4" />
// To:
<LogOut className="w-4 h-4" />
<span className="text-sm hidden sm:inline">Logout</span>
```
Apply same fix to all page navbars that only show the icon.

---

## Phase 4 — Patient Pages

### 4.1 `PatientDashboard.jsx` [BE+FE] 🔴
**File:** `src/pages/PatientDashboard.jsx`

| Issue | Fix |
|---|---|
| Stats (2 appointments, 5 prescriptions, 85 score) hardcoded | Fetch: `GET /api/appointments?status=scheduled` count, `GET /api/prescriptions?status=active` count |
| Urgent Alerts = 0 hardcoded | Fetch: `GET /api/notifications/unread-count` |
| Upcoming appointments hardcoded (Dr. Sarah, Dr. Chen) | Fetch: `GET /api/appointments?limit=2` and render real data |
| Health alerts unclickable | Navigate to `/patient/prescriptions` or `/patient/symptom-checker` on click |
| Active prescription unclickable | Navigate to `/patient/prescriptions` |
| Health Score no redirection | Navigate to `/patient/profile#health-metrics` |
| Urgent alerts no redirection | Navigate to `/patient/symptom-checker` |
| "Upcoming Appointments" card doesn't redirect | Add `onClick={() => navigate('/patient/appointments')}` |
| On login → no prompt to complete health profile | After login, call `GET /api/patients/me`, if `profile === null` show toast/banner: *"Complete your health profile"* with link |

### 4.2 `AppointmentBooking.jsx` [BE+FE] 🔴
**File:** `src/pages/AppointmentBooking.jsx`

| Issue | Fix |
|---|---|
| 3 hardcoded doctors | Fetch: `GET /api/doctors` on mount, render real list |
| No search function for doctors | Add search input → `GET /api/doctors?search=query` |
| Time slots hardcoded | Fetch: `GET /api/doctors/:id/slots?date=selectedDate` |
| Calendar shows past dates | Set `min={new Date().toISOString().split('T')[0]}` on date input |
| Calendar shows distant future dates | Set `max` to 3 months from today |
| `handleConfirmAppointment` saves nothing | Wire: `POST /api/appointments` with `{doctorId, date, time, type, reason}` |
| Download confirmation not working | Use appointment data from API response in `downloadAppointmentConfirmation()` |
| Cancel/reschedule not available | Add "Cancel" button → `PATCH /api/appointments/:id/status` with `{status: 'cancelled'}` |

### 4.3 `PrescriptionPage.jsx` [BE+FE] 🔴
**File:** `src/pages/PrescriptionPage.jsx`

| Issue | Fix |
|---|---|
| Prescriptions are mock data | Fetch: `GET /api/prescriptions` on mount |
| "Add Prescription" button visible to patients | Remove button — only doctors create prescriptions. Check `currentUser.role` and hide if `'patient'` |
| Delete prescription visible to patients | Remove delete button for patients. Only admin/doctor can delete |
| Refill request updates local state only | Wire: `POST /api/prescriptions/:id/refill` |

### 4.4 `PatientProfilePage.jsx` [BE+FE] 🟡
**File:** `src/pages/PatientProfilePage.jsx`

| Issue | Fix |
|---|---|
| Profile reads from mock `currentUser` | Fetch: `GET /api/patients/me` on mount |
| Profile updates lost on refresh | Wire: `PUT /api/patients/me` on save |

### 4.5 `PatientRegistrationForm.jsx` [BE+FE] 🟡
**File:** `src/pages/PatientRegistrationForm.jsx`

| Issue | Fix |
|---|---|
| Saves to localStorage only | On submit: `PUT /api/patients/me` with form data |
| `conditions` field name | Backend accepts both `conditions` and `medicalConditions` ✅ already handled |

### 4.6 `TreatmentRecommendations.jsx` [DEFER] 🟢
**File:** `src/pages/TreatmentRecommendations.jsx`

| Issue | Fix |
|---|---|
| View details unclickable | Add modal/drawer with full treatment details |
| Print plan not working | Use `window.print()` or `pdfGenerator.js` (already exists) |
| Share with doctor | [DEFER] Needs messaging system |

> Keep mock data for now. Real ML integration is Phase 5.

### 4.7 Patient Dashboard — Video Consultation [DEFER] 🟢
Needs a real video call integration (WebRTC / Daily.co / Jitsi). Defer to separate phase.

---

## Phase 5 — Doctor Pages

### 5.1 `DoctorDashboard.jsx` [BE+FE] 🔴
**File:** `src/pages/DoctorDashboard.jsx`

| Issue | Fix |
|---|---|
| Stats hardcoded (8 patients, 45 consultations) | Fetch: `GET /api/appointments?status=scheduled` for today's count |
| Today's appointments hardcoded | Fetch: `GET /api/appointments` filtered to today's date |
| Today's appointment Action button unclickable | Navigate to `/doctor/appointments` + filter by that appointment ID |
| Urgent cases hardcoded + unclickable | Wire to high-priority notifications from `GET /api/notifications?priority=high`, make clickable → navigate to patient view |
| Logout shows only icon, no text | Add `<span>Logout</span>` next to `<LogOut />` icon |

### 5.2 `DoctorAppointmentsPage.jsx` [BE+FE] 🔴
**File:** `src/pages/DoctorAppointmentsPage.jsx`

| Issue | Fix |
|---|---|
| Appointments are mock data | Fetch: `GET /api/appointments` on mount |
| Status changes lost on refresh | Wire: `PATCH /api/appointments/:id/status` |
| Edit appointment — reason should not be editable | Remove `reason` field from edit modal; reason is set by patient at booking time |
| Prescription from consultation | Add "Create Prescription" button per appointment → navigate to prescription form with patientId pre-filled |
| Send reminder button | Wire: `PATCH /api/appointments/:id/reminder` |

### 5.3 `DoctorProfilePage.jsx` [BE+FE] 🟡
**File:** `src/pages/DoctorProfilePage.jsx`

| Issue | Fix |
|---|---|
| Reads mock data | Fetch: `GET /api/doctors/me` on mount |
| Updates lost on refresh | Wire: `PUT /api/doctors/me` on save |
| Schedule update not working | `PUT /api/doctors/me` with `availableSlots` object |

### 5.4 `DoctorRegistrationForm.jsx` [BE+FE] 🟡
**File:** `src/pages/DoctorRegistrationForm.jsx`

| Issue | Fix |
|---|---|
| Saves to localStorage only | Wire: `PUT /api/doctors/me` on submit |
| Documents saved as base64 to localStorage | Keep `documentUploadHandler.js` for local validation, but send only metadata to `POST /api/doctors/me/documents` |

### 5.5 `PatientList.jsx` [BE+FE] 🔴
**File:** `src/pages/PatientList.jsx`

| Issue | Fix |
|---|---|
| Mock patient list | Fetch: `GET /api/patients` on mount |
| Search not working | Wire search input: `GET /api/patients?search=query&page=1` |
| Filter not working | Add filter dropdown → `GET /api/patients?bloodType=O+` etc. |
| Message patient — unimplemented | [DEFER] Needs messaging system |
| View details | Navigate to `/doctor/patients/:id` (needs new route + page) OR show modal with patient health profile |
| Treatment plans for patient | [DEFER] Needs `TreatmentController` to be built |

### 5.6 `DrugInteractionChecker.jsx` [BE+FE] 🟡
**File:** `src/pages/DrugInteractionChecker.jsx`

| Issue | Fix |
|---|---|
| Only 10 hardcoded drugs | Wire search: `GET /api/medications?search=query` |
| Same 3 interaction results every time | Wire: `POST /api/interactions/check` with selected drug names |

---

## Phase 6 — Landing Page & Polish

### 6.1 `Landing.jsx` [FE] 🟢
**File:** `src/pages/Landing.jsx`

| Issue | Fix |
|---|---|
| "Watch Demo" button does nothing | Embed YouTube video modal or link to demo video |
| "Create Account" → "I agree" not enforced | Already fixed in SignUp.jsx (Phase 2) |

### 6.2 Responsiveness [FE] 🟡
Check all pages on mobile breakpoints. Apply Tailwind responsive classes:
- Navbars collapse to hamburger menu on mobile
- Tables scroll horizontally on small screens
- Cards stack vertically on mobile (already using `grid md:grid-cols-X` pattern ✅ mostly done)

### 6.3 `SymptomChecker.jsx` [FE] 🟡
**File:** `src/pages/SymptomChecker.jsx`

| Issue | Fix |
|---|---|
| Predefined set of questions and replies | Already uses Groq AI ✅ — just needs `VITE_GROQ_API_KEY` in `.env` |
| API key not set = broken | Add fallback message: *"AI service is currently unavailable"* |

---

## Summary: Issue → Category Map

| Issue | Category | Phase |
|---|---|---|
| No notification icon | BE+FE | Phase 1 |
| Create account T&C not enforced | FE | Phase 2 |
| T&C link goes to homepage | FE | Phase 2 |
| Forgot password reset link not sent | BE+FE | Phase 2 |
| OTP verification missing | BE+FE | Phase 2 |
| Doctor logout text missing | FE | Phase 3 |
| Doctor can't update schedule | BE+FE | Phase 5 |
| Doctor patients — message | DEFER | Later |
| Doctor patients — view details | BE+FE | Phase 5 |
| Doctor patients — treatment plans | DEFER | Later |
| Doctor consultation — prescription | BE+FE | Phase 5 |
| Today's appointment — action | BE+FE | Phase 5 |
| Edit appointment — reason editable | FE | Phase 5 |
| My patients — search/filter | BE+FE | Phase 5 |
| Drug checker — all drugs | BE+FE | Phase 5 |
| Drug checker — same 3 results | BE+FE | Phase 5 |
| Urgent cases unclickable | BE+FE | Phase 5 |
| Watch demo | FE | Phase 6 |
| I agree not enforced | FE | Phase 2 |
| Patient — notify complete health profile | BE+FE | Phase 4 |
| Calendar shows past dates | FE | Phase 4 |
| Upcoming appointments no redirect | FE | Phase 4 |
| Video consultation | DEFER | Later |
| Health score no redirection | FE | Phase 4 |
| Treatment rec — view/print/share | FE/DEFER | Phase 4 |
| Patient — add prescription visible | FE | Phase 4 |
| Cancel/reschedule appointment | BE+FE | Phase 4 |
| Health alerts unclickable | FE | Phase 4 |
| Active prescription unclickable | FE | Phase 4 |
| Health score + urgent alerts unclickable | FE | Phase 4 |
| Symptom checker — predefined qs | FE (.env) | Phase 6 |
| Book appointment — only 3 doctors | BE+FE | Phase 4 |
| Book appointment — past/future dates | FE | Phase 4 |
| Download confirmation not working | FE | Phase 4 |
| Delete prescription by admin only | BE+FE | Phase 4 |
| Responsiveness | FE | Phase 6 |

---

## Execution Order

```
Phase 1 → api.js + .env + NotificationBell component
Phase 2 → SignIn + SignUp (real auth) + PasswordReset
Phase 3 → Add notification bell to all navbars + logout text
Phase 4 → All patient pages wired to backend
Phase 5 → All doctor pages wired to backend
Phase 6 → Landing polish + responsiveness + Symptom Checker env key
```

> **Estimated work:** Each phase is 1–2 days of focused development.
> **Biggest wins first:** Phases 1+2 unlock everything else because they establish real auth tokens.
