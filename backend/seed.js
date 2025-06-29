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

        console.log('👤 [db seed] Creating admin user...');
        
        // Hash admin password
        const salt = await bcrypt.genSalt(10);
        adminUser.password = await bcrypt.hash(adminUser.password, salt);
        
        // Create admin user
        const admin = await User.create(adminUser);
        console.log('✅ [db seed] Admin user created');

        console.log('👨‍⚕️ [db seed] Creating advisor accounts...');
        
        // Create advisor accounts
        for (const advisor of sampleAdvisors) {
            // Hash password
            advisor.password = await bcrypt.hash(advisor.password, salt);
            
            // Create advisor
            const createdAdvisor = await User.create(advisor);
            console.log(`✅ [db seed] Created advisor: ${createdAdvisor.firstName} ${createdAdvisor.lastName}`);
        }

        console.log('👩‍🦰 [db seed] Creating client account...');
        
        // Hash client password
        sampleClient.password = await bcrypt.hash(sampleClient.password, salt);
        
        // Create client
        const client = await User.create(sampleClient);
        console.log('✅ [db seed] Client account created');

        console.log('\n🎉 [db seed] Database seeded successfully!');
        console.log('\n📝 [db seed] Login credentials:');
        console.log('[db seed] Admin: admin@consult.ytech.com / Admin123!');
        console.log('[db seed] Advisor 1: john.smith@consult.ytech.com / Advisor123!');
        console.log('[db seed] Advisor 2: sarah.johnson@consult.ytech.com / Advisor123!');
        console.log('[db seed] Client: jane.doe@gmail.com / Client123!');

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