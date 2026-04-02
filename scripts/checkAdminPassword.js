const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const chalk = require('chalk');

const AdminUser = require('../models/admin/AdminUser');

const checkAdmin = async () => {
  try {
    console.log(chalk.blue('\n🔌 Connecting to MongoDB...'));
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(chalk.green('✅ Connected to MongoDB\n'));

    const email = process.argv[2] || 'hdm@gmail.com';
    const testPassword = process.argv[3];

    const admin = await AdminUser.findOne({ email });
    
    if (!admin) {
      console.log(chalk.red(`❌ Admin not found with email: ${email}`));
      process.exit(1);
    }

    console.log(chalk.cyan('📋 Admin Details:'));
    console.log(chalk.white(`   ID: ${admin._id}`));
    console.log(chalk.white(`   Name: ${admin.name}`));
    console.log(chalk.white(`   Email: ${admin.email}`));
    console.log(chalk.white(`   Role: ${admin.role}`));
    console.log(chalk.white(`   Status: ${admin.isActive ? 'Active' : 'Inactive'}`));
    console.log(chalk.white(`   Stored Hash: ${admin.password.substring(0, 30)}...`));
    console.log('');

    if (testPassword) {
      console.log(chalk.blue(`🔍 Testing password: "${testPassword}"`));
      const isMatch = await bcrypt.compare(testPassword, admin.password);
      console.log(chalk.white(`   Result: ${isMatch ? '✅ MATCHES' : '❌ DOES NOT MATCH'}`));
      
      if (!isMatch) {
        console.log(chalk.yellow('\n💡 Try resetting password:'));
        console.log(chalk.white(`   node scripts/resetAdminPassword.js ${email} newpassword`));
      }
    } else {
      console.log(chalk.yellow('💡 To test a password, run:'));
      console.log(chalk.white(`   node scripts/checkAdminPassword.js ${email} yourpassword\n`));
    }

  } catch (err) {
    console.error(chalk.red('❌ Error:'), err);
  } finally {
    await mongoose.disconnect();
    console.log(chalk.blue('\n👋 Disconnected\n'));
    process.exit(0);
  }
};

checkAdmin();