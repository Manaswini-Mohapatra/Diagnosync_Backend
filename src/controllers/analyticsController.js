const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');


exports.getDoctorAnalytics = async (req, res, next) => {
  try {
    const doctorId = req.user._id;
    const { range } = req.query; // today, week, month

 
    const now = new Date();
    let startDate = new Date(0); 

    if (range === 'today') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (range === 'week') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (range === 'month') {
      startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    // Summary Metrics
    const appointments = await Appointment.find({
      doctorId,
      status: { $ne: 'cancelled' }
    });

    const totalConsultations = appointments.length;
    
    // Consultations in filtered range
    const rangeAppointments = appointments.filter(a => a.date >= startDate);
    const rangeConsultations = rangeAppointments.length;

    // Average duration
    const completedApts = appointments.filter(a => a.status === 'completed');
    const totalDuration = completedApts.reduce((acc, curr) => acc + (curr.duration || 30), 0);
    const avgDuration = completedApts.length > 0 ? Math.round(totalDuration / completedApts.length) : 0;

    // Trends (Last 7 or 30 days)
    const trendData = await Appointment.aggregate([
      {
        $match: {
          doctorId: new mongoose.Types.ObjectId(doctorId),
          status: { $ne: 'cancelled' },
          date: { $gte: range === 'month' ? new Date(new Date().setMonth(new Date().getMonth() - 1)) : new Date(new Date().setDate(new Date().getDate() - 7)) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Formatted trend data
    const formattedTrends = trendData.map(item => ({
      date: item._id,
      consultations: item.count
    }));

    // Distribution (Video vs In-person)
    const typeDistribution = await Appointment.aggregate([
      {
        $match: {
          doctorId: new mongoose.Types.ObjectId(doctorId),
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 }
        }
      }
    ]);

    const distribution = typeDistribution.map(item => ({
      name: item._id === 'video' ? 'Video Call' : (item._id === 'in-person' ? 'In-Person' : 'Other'),
      value: item.count
    }));

    // Patient Retention
    const patientStats = await Appointment.aggregate([
      {
        $match: {
          doctorId: new mongoose.Types.ObjectId(doctorId),
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: "$patientId",
          visitCount: { $sum: 1 }
        }
      }
    ]);

    const totalUniquePatients = patientStats.length;
    const returningPatients = patientStats.filter(p => p.visitCount >= 2).length;
    const retentionRate = totalUniquePatients > 0 ? Math.round((returningPatients / totalUniquePatients) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalConsultations,
          rangeConsultations,
          avgDuration,
          retentionRate
        },
        trends: formattedTrends,
        distribution,
        patientRetention: {
          total: totalUniquePatients,
          returning: returningPatients,
          new: totalUniquePatients - returningPatients,
          rate: retentionRate
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
