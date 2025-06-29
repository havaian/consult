// backend/seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('./src/user/model');
const Specialization = require('./src/specializations/model');

// Set longer timeout for MongoDB operations
mongoose.set('bufferTimeoutMS', 30000);

// MongoDB connection with options to avoid buffering issues
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ [db seed] Connected to MongoDB');
    } catch (err) {
        console.error('❌ [db seed] MongoDB connection error:', err);
        process.exit(1);
    }
};

// Seed data
const specializations = [
    { name: 'Corporate Law', description: 'Business formation, contracts, and corporate governance', icon: 'fa-building' },
    { name: 'Family Law', description: 'Divorce, custody, adoption, and domestic relations', icon: 'fa-home' },
    { name: 'Criminal Defense', description: 'Criminal charges, defense strategies, and court representation', icon: 'fa-shield-alt' },
    { name: 'Real Estate Law', description: 'Property transactions, landlord-tenant, and real estate disputes', icon: 'fa-house-user' },
    { name: 'Employment Law', description: 'Workplace rights, discrimination, and labor disputes', icon: 'fa-briefcase' },
    { name: 'Immigration Law', description: 'Visa applications, citizenship, and immigration procedures', icon: 'fa-globe' },
    { name: 'Personal Injury', description: 'Accident claims, medical malpractice, and compensation cases', icon: 'fa-user-injured' },
    { name: 'Intellectual Property', description: 'Patents, trademarks, copyrights, and IP protection', icon: 'fa-lightbulb' },
    { name: 'Tax Law', description: 'Tax planning, disputes, and compliance issues', icon: 'fa-calculator' },
    { name: 'General Legal Advice', description: 'General legal consultation and document review', icon: 'fa-balance-scale' }
];

// Seed function with better error handling
async function seedDatabase() {
    try {
        console.log('🔄 [db seed] Connecting to database...');
        await connectDB();
        
        console.log('🧹 [db seed] Cleaning existing data...');
        
        // Clear existing data with timeout handling
        await Promise.all([
            User.deleteMany({}).maxTimeMS(30000),
            Specialization.deleteMany({}).maxTimeMS(30000)
        ]);
        
        console.log('🌱 [db seed] Seeding specializations...');
        
        // Create specializations
        const createdSpecializations = await Specialization.insertMany(specializations);
        console.log(`✅ [db seed] Created ${createdSpecializations.length} specializations`);
    } catch (error) {
        console.error('❌ [db seed] Seeding error:', error);
    } finally {
        // Always disconnect
        try {
            await mongoose.disconnect();
            console.log('🔌 [db seed] Disconnected from MongoDB');
        } catch (disconnectError) {
            console.error('[db seed] Error disconnecting:', disconnectError);
        }
        process.exit(0);
    }
}

// Run the seeder
seedDatabase();