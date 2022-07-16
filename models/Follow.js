const mongoose = require('mongoose');

const FollowSchema = new mongoose.Schema({
    by:{
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
      },
    to:{
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        default: "PENDING"
    },
    createdAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model('Follow', FollowSchema);