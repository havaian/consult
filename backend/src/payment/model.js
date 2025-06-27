const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
    appointment: {
        type: Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true
    },
    client: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    advisor: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'uzs'
    },
    status: {
        type: String,
        enum: ['pending', 'succeeded', 'failed', 'canceled'],
        default: 'pending'
    },
    stripeSessionId: {
        type: String
    },
    checkoutUrl: {
        type: String
    },
    paidAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for faster queries
paymentSchema.index({ appointment: 1 });
paymentSchema.index({ client: 1 });
paymentSchema.index({ advisor: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ stripeSessionId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;