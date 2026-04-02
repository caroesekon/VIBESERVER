const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const bcrypt = require('bcryptjs');
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

const setPassword = async () => {
  try {
    console.log(chalk.blue('\n🔌 Connecting to MongoDB...'));
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(chalk.green('✅ Connected to MongoDB\n'));

    const email = await question(chalk.white('Enter admin email: '));
    const newPassword = await question(chalk.white('Enter new password: '));

    if (!email || !newPassword) {
      console.log(chalk.red('❌ Email and password required'));
      process.exit(1);
    }

    const admin = await AdminUser.findOne({ email });
    if (!admin) {
      console.log(chalk.red(`❌ Admin with email ${email} not found`));
      process.exit(1);
    }

    console.log(chalk.blue('\n🔐 Hashing password...'));
    const hash = bcrypt.hashSync(newPassword, 10);
    
    admin.password = hash;
    await admin.save();

    const verify = bcrypt.compareSync(newPassword, admin.password);
    
    console.log(chalk.green('\n✅ Password updated!'));
    console.log(chalk.cyan('📋 Details:'));
    console.log(chalk.white(`   Email: ${admin.email}`));
    console.log(chalk.white(`   Name: ${admin.name}`));
    console.log(chalk.white(`   New Password: ${newPassword}`));
    console.log(chalk.white(`   Verification: ${verify ? '✅ SUCCESS' : '❌ FAILED'}\n`));

  } catch (err) {
    console.error(chalk.red('❌ Error:'), err);
  } finally {
    await mongoose.disconnect();
    rl.close();
    process.exit(0);
  }
};

setPassword();