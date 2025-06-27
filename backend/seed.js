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
    { name: 'Cardiology', description: 'Heart and cardiovascular system specialists', icon: 'fa-heart' },
    { name: 'Pediatrics', description: 'Child healthcare specialists', icon: 'fa-child' },
    { name: 'Dermatology', description: 'Skin, hair, and nail specialists', icon: 'fa-hand-holding-legal' },
    { name: 'Neurology', description: 'Nervous system specialists', icon: 'fa-brain' },
    { name: 'Orthopedics', description: 'Musculoskeletal system specialists', icon: 'fa-bone' },
    { name: 'Gynecology', description: 'Women\'s health specialists', icon: 'fa-female' },
    { name: 'Psychiatry', description: 'Mental health specialists', icon: 'fa-head-side-virus' },
    { name: 'Ophthalmology', description: 'Eye care specialists', icon: 'fa-eye' },
    { name: 'General Issue', description: 'General practitioners and family issues', icon: 'fa-user-md' },
    { name: 'Endocrinology', description: 'Hormone and metabolic disorder specialists', icon: 'fa-dna' }
];

const adminUser = {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@online-consult.com',
    password: 'Admin123!',
    phone: '+998901234567',
    role: 'admin',
    isActive: true,
    isVerified: true
};

const sampleAdvisors = [
    {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@online-consult.com',
        password: 'Advisor123!',
        phone: '+998901234568',
        role: 'advisor',
        specializations: ['Cardiology'],
        licenseNumber: 'MD12345',
        experience: 15,
        bio: 'Experienced cardiologist with 15 years of practice in treating heart conditions.',
        languages: ['English', 'Russian', 'Uzbek'],
        consultationFee: 150000,
        isActive: true,
        isVerified: true,
        availability: [
            { dayOfWeek: 1, isAvailable: true, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 2, isAvailable: true, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 3, isAvailable: true, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 4, isAvailable: true, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 5, isAvailable: true, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 6, isAvailable: false, startTime: null, endTime: null },
            { dayOfWeek: 0, isAvailable: false, startTime: null, endTime: null }
        ]
    },
    {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@online-consult.com',
        password: 'Advisor123!',
        phone: '+998901234569',
        role: 'advisor',
        specializations: ['Pediatrics'],
        licenseNumber: 'MD54321',
        experience: 10,
        bio: 'Dedicated pediatrician specializing in child development and preventive care.',
        languages: ['English', 'Uzbek'],
        consultationFee: 120000,
        isActive: true,
        isVerified: true,
        availability: [
            { dayOfWeek: 1, isAvailable: true, startTime: '08:00', endTime: '16:00' },
            { dayOfWeek: 2, isAvailable: true, startTime: '08:00', endTime: '16:00' },
            { dayOfWeek: 3, isAvailable: true, startTime: '08:00', endTime: '16:00' },
            { dayOfWeek: 4, isAvailable: true, startTime: '08:00', endTime: '16:00' },
            { dayOfWeek: 5, isAvailable: true, startTime: '08:00', endTime: '16:00' },
            { dayOfWeek: 6, isAvailable: true, startTime: '09:00', endTime: '13:00' },
            { dayOfWeek: 0, isAvailable: false, startTime: null, endTime: null }
        ]
    }
];

const sampleClient = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@gmail.com',
    password: 'Client123!',
    phone: '+998901234570',
    role: 'client',
    dateOfBirth: new Date('1990-01-15'),
    gender: 'female',
    isActive: true,
    isVerified: true,
    legalHistory: {
        allergies: ['Penicillin'],
        chronicConditions: ['Hypertension'],
        currentActions: ['Lisinopril']
    },
    emergencyContact: {
        name: 'John Doe',
        relationship: 'Husband',
        phone: '+998901234571'
    }
};

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
        console.log('[db seed] Admin: admin@online-consult.com / Admin123!');
        console.log('[db seed] Advisor 1: john.smith@online-consult.com / Advisor123!');
        console.log('[db seed] Advisor 2: sarah.johnson@online-consult.com / Advisor123!');
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