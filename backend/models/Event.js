const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  eventType: {
    type: String,
    enum: ['farmers_market', 'workshop', 'festival', 'exhibition', 'conference'],
    required: true,
    default: 'farmers_market'
  },
  location: {
    address: {
      type: String,
      required: [true, 'Event address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  dateTime: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide valid time format (HH:MM)']
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide valid time format (HH:MM)']
    }
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  capacity: {
    maxAttendees: {
      type: Number,
      required: [true, 'Maximum attendees is required'],
      min: [1, 'Capacity must be at least 1']
    },
    currentAttendees: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  registrationFee: {
    type: Number,
    default: 0,
    min: [0, 'Registration fee cannot be negative']
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    }
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  requirements: {
    type: String,
    trim: true,
    maxlength: [500, 'Requirements cannot be more than 500 characters']
  },
  contactInfo: {
    email: {
      type: String,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide valid email']
    },
    phone: {
      type: String,
      trim: true
    }
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'cancelled'],
      default: 'registered'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    }
  }],
  vendors: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    businessName: {
      type: String,
      required: true,
      trim: true
    },
    products: [{
      type: String,
      trim: true
    }],
    stallNumber: {
      type: String,
      trim: true
    },
    approvedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Review-related fields
  averageRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  totalReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Validate end date is after start date
eventSchema.pre('save', function(next) {
  if (this.dateTime.endDate <= this.dateTime.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Update current attendees count
eventSchema.pre('save', function(next) {
  if (this.isModified('attendees')) {
    this.capacity.currentAttendees = this.attendees.filter(
      attendee => attendee.status === 'registered' || attendee.status === 'attended'
    ).length;
  }
  next();
});

// Virtual for availability
eventSchema.virtual('isAvailable').get(function() {
  return this.capacity.currentAttendees < this.capacity.maxAttendees && 
         this.status === 'published' && 
         new Date() < this.dateTime.startDate;
});

// Virtual for event duration
eventSchema.virtual('duration').get(function() {
  const start = new Date(this.dateTime.startDate);
  const end = new Date(this.dateTime.endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)); // Duration in days
});

// Virtual for spots remaining
eventSchema.virtual('spotsRemaining').get(function() {
  return Math.max(0, this.capacity.maxAttendees - this.capacity.currentAttendees);
});

// Indexes for better query performance
eventSchema.index({ 'dateTime.startDate': 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ 'location.city': 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ tags: 1 });

module.exports = mongoose.model('Event', eventSchema);