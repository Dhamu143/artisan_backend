const mongoose = require('mongoose');

const JobApplicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosting',
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  resumeUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Reviewed', 'Rejected', 'Accepted'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('JobApplication', JobApplicationSchema);