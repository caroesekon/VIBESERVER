const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

const checkAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(chalk.blue('✅ Connected to MongoDB'));

    const admins = await AdminUser.find().select('name email role isActive');
    
    if (admins.length === 0) {
      console.log(chalk.yellow('\n⚠️ No admin users found!'));
      console.log(chalk.white('Run `npm run create-admin` to create one.\n'));
      process.exit(0);
    }

    console.log(chalk.green(`\n📋 Found ${admins.length} admin(s):\n`));
    
    admins.forEach((admin, index) => {
      console.log(chalk.cyan(`   ${index + 1}. ${admin.name}`));
      console.log(chalk.white(`      Email: ${admin.email}`));
      console.log(chalk.white(`      Role: ${admin.role}`));
      console.log(chalk.white(`      Status: ${admin.isActive ? '✅ Active' : '❌ Inactive'}`));
      console.log('');
    });

    // Ask if user wants to reset password
    const resetChoice = await question(chalk.yellow('Do you want to reset password for any admin? (yes/no): '));
    
    if (resetChoice.toLowerCase() === 'yes') {
      const email = await question(chalk.white('Enter admin email to reset password: '));
      const admin = await AdminUser.findOne({ email });
      
      if (!admin) {
        console.log(chalk.red(`❌ Admin with email ${email} not found`));
        await mongoose.disconnect();
        rl.close();
        process.exit(0);
      }

      const newPassword = await question(chalk.white('Enter new password (min 6 chars): '));
      
      if (newPassword.length < 6) {
        console.log(chalk.red('❌ Password must be at least 6 characters'));
        await mongoose.disconnect();
        rl.close();
        process.exit(0);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      admin.password = hashedPassword;
      await admin.save();
      
      console.log(chalk.green(`\n✅ Password reset for ${admin.email}`));
      console.log(chalk.white(`   New password: ${newPassword}`));
    }

    // Ask if user wants to create new admin
    const createChoice = await question(chalk.yellow('\nDo you want to create a new admin? (yes/no): '));
    
    if (createChoice.toLowerCase() === 'yes') {
      const name = await question(chalk.white('Enter admin name: '));
      const email = await question(chalk.white('Enter admin email: '));
      const password = await question(chalk.white('Enter admin password (min 6 chars): '));
      const role = await question(chalk.white('Role (superadmin/admin/moderator) [admin]: ')) || 'admin';

      if (!name || !email || password.length < 6) {
        console.log(chalk.red('❌ Name, valid email, and password (≥6 chars) required.'));
        await mongoose.disconnect();
        rl.close();
        process.exit(0);
      }

      const existing = await AdminUser.findOne({ email });
      if (existing) {
        console.log(chalk.red(`❌ Admin with email ${email} already exists`));
        await mongoose.disconnect();
        rl.close();
        process.exit(0);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = await AdminUser.create({
        name,
        email,
        password: hashedPassword,
        role,
        isActive: true,
      });

      console.log(chalk.green(`\n✅ New admin created: ${newAdmin.email}`));
      console.log(chalk.white(`   Name: ${newAdmin.name}`));
      console.log(chalk.white(`   Role: ${newAdmin.role}`));
      console.log(chalk.white(`   Password: ${password}`));
    }

  } catch (err) {
    console.error(chalk.red('❌ Error:'), err);
  } finally {
    await mongoose.disconnect();
    rl.close();
    console.log(chalk.blue('\n👋 Disconnected from MongoDB'));
    process.exit(0);
  }
};

checkAdmin();