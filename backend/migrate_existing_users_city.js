const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

// Migration function to set city field for existing users
const migrateExistingUsers = async () => {
  try {
    console.log('Starting migration to set city field for existing users...');
    
    // Find all users without a city field or with null/undefined city
    const usersWithoutCity = await User.find({
      $or: [
        { city: { $exists: false } },
        { city: null },
        { city: undefined },
        { city: '' }
      ]
    });
    
    console.log(`Found ${usersWithoutCity.length} users without city field`);
    
    if (usersWithoutCity.length === 0) {
      console.log('No users need migration. All users already have city field set.');
      return;
    }
    
    // Update all users without city to have 'Dhaka' as default
    const result = await User.updateMany(
      {
        $or: [
          { city: { $exists: false } },
          { city: null },
          { city: undefined },
          { city: '' }
        ]
      },
      {
        $set: { city: 'Dhaka' }
      }
    );
    
    console.log(`Migration completed successfully!`);
    console.log(`Updated ${result.modifiedCount} users with city: 'Dhaka'`);
    
    // Verify the migration
    const verifyCount = await User.countDocuments({ city: 'Dhaka' });
    console.log(`Verification: ${verifyCount} users now have city set to 'Dhaka'`);
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    throw error;
  }
};

// Main execution function
const runMigration = async () => {
  try {
    await connectDB();
    await migrateExistingUsers();
    console.log('Migration process completed successfully!');
  } catch (error) {
    console.error('Migration process failed:', error.message);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  }
};

// Run the migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { migrateExistingUsers, runMigration };