# Phase 4e: Notifications Strategy & Implementation

This plan outlines how the Notification system will be integrated across DiagnoSync to keep patients and doctors informed of critical events in real-time.

## 1. How Notifications Should Work (Workflows)

### Appointments
- **Booking:** When a patient books an appointment, the **Doctor** receives an in-app notification ("New Appointment Request"). The **Patient** receives one confirming it is scheduled.
- **Status Change/Cancellation:** If a patient cancels, the doctor is notified. If a doctor cancels or marks it complete, the patient is notified.
- **Reminders:** When a doctor clicks "Send Reminder" on the dashboard, it generates an urgent system notification for the patient.

### Prescriptions & Refills (Answering your question: Yes!)
- Absolutely! When a patient requests a refill using the `POST /:id/refill` endpoint, the **Doctor** MUST receive a notification ("Refill Requested by [Patient Name]"). Otherwise, the doctor would never know to approve it or prepare it!
- **New Prescription:** When a doctor writes a new prescription, the **Patient** receives a notification.

### Treatments
- When a doctor clicks "Verify" on the AI-generated treatment plan, the **Patient** receives a notification ("Your treatment plan has been reviewed and verified by Dr. [Name]").

## 2. Pages That Need Notification Integration
To support this backend system, the following frontend pages will need to be hooked up to the new Notification endpoints during your frontend integration phase:
1. **Global Header (All Pages):** The little "Bell" icon in the top right corner. It needs to fetch unread notifications via a `GET /api/notifications` endpoint and show a red badge.
2. **Patient Dashboard (`PatientDashboard.jsx`):** Under the "Health Alerts / Notifications" widget.
3. **Doctor Dashboard (`DoctorDashboard.jsx`):** To see incoming refill requests and new appointments immediately upon logging in.

---

## Proposed Changes

### [Notification Core]
#### [NEW] [notificationController.js](file:///e:/DIAGNOSYNC/DiagnoSync/Diagnosync_Backend/src/controllers/notificationController.js)
#### [NEW] [notificationRoutes.js](file:///e:/DIAGNOSYNC/DiagnoSync/Diagnosync_Backend/src/routes/notificationRoutes.js)
- Create standard endpoints: `GET /` (list), `PATCH /:id/read`, `PATCH /read-all`

---

### [Event Triggers]
#### [MODIFY] [appointmentController.js](file:///e:/DIAGNOSYNC/DiagnoSync/Diagnosync_Backend/src/controllers/appointmentController.js)
- Add notification creation logic inside `createAppointment`, `updateStatus`, and `sendReminder`.

#### [MODIFY] [prescriptionController.js](file:///e:/DIAGNOSYNC/DiagnoSync/Diagnosync_Backend/src/controllers/prescriptionController.js)
- Add notification creation logic inside `createPrescription` and `requestRefill`.

#### [MODIFY] [treatmentController.js](file:///e:/DIAGNOSYNC/DiagnoSync/Diagnosync_Backend/src/controllers/treatmentController.js)
- Add notification creation logic inside `verifyTreatment`.

#### [MODIFY] [server.js](file:///e:/DIAGNOSYNC/DiagnoSync/Diagnosync_Backend/src/server.js)
- Mount `/api/notifications` route.

## User Review Required
> [!IMPORTANT]
> Because this touches `appointmentController`, `prescriptionController`, and `treatmentController` all at once, please review the event rules above. Does this notification strategy cover all the workflows you had in mind? If so, approve the plan and I will write the code!
