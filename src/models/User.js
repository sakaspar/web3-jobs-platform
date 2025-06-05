const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    userType: {
        type: String,
        enum: ['recruiter', 'candidate'],
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    profile: {
        title: String,
        bio: String,
        skills: [String],
        experience: [{
            title: String,
            company: String,
            duration: String,
            description: String
        }],
        education: [{
            degree: String,
            institution: String,
            year: Number
        }]
    },
    company: {
        name: String,
        website: String,
        description: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User; 