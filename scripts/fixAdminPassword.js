const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const mongoose = require('mongoose');
const readline = require('readline');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const chalk = require('chalk');

const AdminUser = require('../models/admin/AdminUser');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Known working hash for "password123"
const WORKING_HASH = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

const fixAdminPassword = async () => {
  try {
    console.log(chalk.blue('\n🔌 Connecting to MongoDB...'));
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(chalk.green('✅ Connected to MongoDB\n'));

    // Get all admins
    const admins = await AdminUser.find().select('email name');
    if (admins.length === 0) {
      console.log(chalk.red('❌ No admin users found in database!'));
      process.exit(1);
    }

    console.log(chalk.cyan('📋 Available admins:\n'));
    admins.forEach((admin, idx) => {
      console.log(chalk.white(`   ${idx + 1}. ${admin.email} (${admin.name})`));
    });
    console.log('');

    const email = await question(chalk.white('Enter admin email to fix password: '));
    const admin = await AdminUser.findOne({ email });
    
    if (!admin) {
      console.log(chalk.red(`\n❌ Admin with email ${email} not found`));
      process.exit(1);
    }

    console.log(chalk.cyan(`\n📋 Selected admin: ${admin.name} (${admin.email})\n`));

    console.log(chalk.blue('🔐 Setting password to: password123'));
    console.log(chalk.white(`   Using hash: ${WORKING_HASH.substring(0, 30)}...`));

    // Update password with known working hash
    admin.password = WORKING_HASH;
    await admin.save();

    // Verify the update
    const savedAdmin = await AdminUser.findById(admin._id);
    
    console.log(chalk.green('\n✅ Password updated successfully!\n'));
    console.log(chalk.cyan('📋 Admin Details:'));
    console.log(chalk.white(`   Email: ${savedAdmin.email}`));
    console.log(chalk.white(`   Name: ${savedAdmin.name}`));
    console.log(chalk.white(`   Password: password123`));
    console.log(chalk.blue(`\n🔐 Stored hash: ${savedAdmin.password}`));
    console.log(chalk.green('\n🎉 You can now login with:'));
    console.log(chalk.white(`   Email: ${email}`));
    console.log(chalk.white(`   Password: password123\n`));

  } catch (err) {
    console.error(chalk.red('❌ Error:'), err);
  } finally {
    await mongoose.disconnect();
    rl.close();
    console.log(chalk.blue('👋 Disconnected from MongoDB\n'));
    process.exit(0);
  }
};

fixAdminPassword();