const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Prediction = require('../models/Prediction');
const MLTreatment = require('../models/MLTreatment');
const SystemLog = require('../models/SystemLog');

exports.getAdminDashboard = async (req, res, next) => {
  try {
    const { range } = req.query;
    const now = new Date();
    let startDate = new Date();

    if (range === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else if (range === 'yearly') {
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      startDate.setDate(now.getDate() - 30);
    }

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    
    const [
      totalPatients,
      totalDoctors,
      activeUsers,
      newUsersThisMonth,
      totalSymptomAnalyses,
      appointmentStats,
      symptomTrend,
      retentionData,
      topDoctors,
      userGrowth,
      specializations,
      systemPerformance
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),

      User.countDocuments({ role: 'doctor' }),

      User.countDocuments({ isActive: true }),

      User.countDocuments({ createdAt: { $gte: startOfMonth } }),

      Prediction.countDocuments(),

      Appointment.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            video: { $sum: { $cond: [{ $eq: ["$type", "video"] }, 1, 0] } },
            inPerson: { $sum: { $cond: [{ $eq: ["$type", "in-person"] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ["$status", "scheduled"] }, 1, 0] } }
          }
        }
      ]),

      Prediction.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      Appointment.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: "$patientId",
            visits: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: null,
            totalPatients: { $sum: 1 },
            returningPatients: { $sum: { $cond: [{ $gte: ["$visits", 2] }, 1, 0] } }
          }
        }
      ]),

      Appointment.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: "$doctorId",
            consultations: { $sum: 1 }
          }
        },
        { $sort: { consultations: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "doctorDetails"
          }
        },
        { $unwind: "$doctorDetails" },
        {
          $lookup: {
            from: "doctors",
            localField: "_id",
            foreignField: "userId",
            as: "doctorProfile"
          }
        },
        { $unwind: { path: "$doctorProfile", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: "$doctorDetails.name",
            specialty: { $arrayElemAt: ["$doctorProfile.specialties", 0] },
            consultations: 1
          }
        }
      ]),

      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              role: "$role"
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.date": 1 } }
      ]),

      Doctor.aggregate([
        { $unwind: "$specialties" },
        {
          $group: {
            _id: "$specialties",
            count: { $sum: 1 }
          }
        },
        { $match: { _id: { $ne: null } } }
      ]),

      SystemLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            avgResponseTime: { $avg: "$responseTime" },
            errorCount: { $sum: { $cond: [{ $gte: ["$status", 400] }, 1, 0] } },
            totalRequests: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Format Data
    const aptStats = appointmentStats[0] || { total: 0, video: 0, inPerson: 0, completed: 0, cancelled: 0, pending: 0 };
    const retentionStats = retentionData[0] || { totalPatients: 0, returningPatients: 0 };
    const retentionRate = retentionStats.totalPatients > 0 ? ((retentionStats.returningPatients / retentionStats.totalPatients) * 100).toFixed(1) : 0;
    const avgSymptomAnalyses = totalPatients > 0 ? (totalSymptomAnalyses / totalPatients).toFixed(1) : 0;

    // Process User Growth
    const growthMap = {};
    userGrowth.forEach(item => {
      if (!growthMap[item._id.date]) {
        growthMap[item._id.date] = { date: item._id.date, patients: 0, doctors: 0 };
      }
      if (item._id.role === 'patient') growthMap[item._id.date].patients += item.count;
      if (item._id.role === 'doctor') growthMap[item._id.date].doctors += item.count;
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalPatients,
          totalDoctors,
          activeUsers,
          newUsersThisMonth,
          totalSymptomAnalyses,
          totalVideoConsultations: aptStats.video,
          totalInPersonConsultations: aptStats.inPerson,
          totalAppointments: aptStats.total,
          averageSymptomAnalysesPerUser: parseFloat(avgSymptomAnalyses),
          retentionRate: parseFloat(retentionRate)
        },
        charts: {
          userGrowth: Object.values(growthMap),
          doctorToPatientRatio: [
            { name: 'Patients', value: totalPatients },
            { name: 'Doctors', value: totalDoctors }
          ],
          videoVsInPerson: [
            { name: 'Video', value: aptStats.video },
            { name: 'In-Person', value: aptStats.inPerson }
          ],
          appointmentStatus: [
            { name: 'Completed', value: aptStats.completed },
            { name: 'Pending', value: aptStats.pending },
            { name: 'Cancelled', value: aptStats.cancelled }
          ],
          topDoctors: topDoctors.map(d => ({ name: d.name, consultations: d.consultations, specialty: d.specialty || 'General' })),
          symptomTrends: symptomTrend.map(t => ({ date: t._id, analyses: t.count })),
          specializations: specializations.map(s => ({ name: s._id, value: s.count })),
          systemPerformance: systemPerformance.map(s => ({
            date: s._id,
            responseTime: Math.round(s.avgResponseTime),
            errors: s.errorCount,
            requests: s.totalRequests
          }))
        }
      }
    });

  } catch (error) {
    console.error('Admin Analytics Error:', error);
    next(error);
  }
};
