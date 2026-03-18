import mongoose from 'mongoose';

const progressMilestoneSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  milestoneType: {
    type: String,
    enum: ['first_15_reduction', 'first_month_improvement', 'three_month_streak', 'six_month_streak'],
    required: true
  },
  achievedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  amountSaved: {
    type: Number,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'progressMilestones'
});

// Índice compuesto para evitar duplicados
progressMilestoneSchema.index({ userId: 1, milestoneType: 1 }, { unique: true });

export const ProgressMilestone = mongoose.model('ProgressMilestone', progressMilestoneSchema);
