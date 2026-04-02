const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const chalk = require('chalk');

const AdminUser = require('../models/admin/AdminUser');

const resetPassword = async () => {
  try {
    const email = process.argv[2];
    const newPassword = process.argv[3];

    if (!email || !newPassword) {
      console.log(chalk.yellow('Usage: node scripts/resetAdminPassword.js <email> <newpassword>'));
      console.log(chalk.white('Example: node scripts/resetAdminPassword.js hdm@gmail.com password123'));
      process.exit(1);
    }

    console.log(chalk.blue('\n🔌 Connecting to MongoDB...'));
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(chalk.green('✅ Connected to MongoDB\n'));

    const admin = await AdminUser.findOne({ email });
    
    if (!admin) {
      console.log(chalk.red(`❌ Admin not found with email: ${email}`));
      process.exit(1);
    }

    console.log(chalk.cyan(`📋 Found admin: ${admin.name} (${admin.email})`));
    
    console.log(chalk.blue('\n🔐 Hashing new password...'));
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    admin.password = hashedPassword;
    await admin.save();
    
    console.log(chalk.green('✅ Password updated successfully!'));
    console.log(chalk.white(`   Email: ${email}`));
    console.log(chalk.white(`   New Password: ${newPassword}`));
    
    // Verify
    const verify = await bcrypt.compare(newPassword, admin.password);
    console.log(chalk.white(`   Verification: ${verify ? '✅ SUCCESS' : '❌ FAILED'}\n`));

  } catch (err) {
    console.error(chalk.red('❌ Error:'), err);
  } finally {
    await mongoose.disconnect();
    console.log(chalk.blue('👋 Done\n'));
    process.exit(0);
  }
};

resetPassword();