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

const createAdmin = async () => {
  try {
    console.log(chalk.blue('\n🔌 Connecting to MongoDB...'));
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(chalk.green('✅ Connected to MongoDB\n'));

    // Check existing admins
    const existingAdmins = await AdminUser.find();
    if (existingAdmins.length > 0) {
      console.log(chalk.yellow(`\n⚠️ Found ${existingAdmins.length} existing admin(s):\n`));
      existingAdmins.forEach((admin, idx) => {
        console.log(chalk.white(`   ${idx + 1}. ${admin.name} - ${admin.email} (${admin.role})`));
      });
      
      const deleteChoice = await question(chalk.red('\n❓ Delete ALL existing admins before creating new one? (yes/no): '));
      if (deleteChoice.toLowerCase() === 'yes') {
        await AdminUser.deleteMany({});
        console.log(chalk.green('✅ All existing admins deleted.'));
      }
    }

    const name = await question(chalk.white('\nEnter admin name: '));
    const email = await question(chalk.white('Enter admin email: '));
    const plainPassword = await question(chalk.white('Enter admin password (min 6 chars): '));
    const role = await question(chalk.white('Role (superadmin/admin/moderator) [admin]: ')) || 'admin';

    if (!name || !email || plainPassword.length < 6) {
      console.log(chalk.red('\n❌ Name, valid email, and password (≥6 chars) required.'));
      process.exit(1);
    }

    // Check if email already exists
    const existingByEmail = await AdminUser.findOne({ email });
    if (existingByEmail) {
      console.log(chalk.red(`\n❌ Admin with email ${email} already exists.`));
      const overwrite = await question(chalk.yellow('Overwrite existing admin? (yes/no): '));
      if (overwrite.toLowerCase() === 'yes') {
        await AdminUser.deleteOne({ email });
        console.log(chalk.green(`✅ Deleted existing admin: ${email}`));
      } else {
        console.log(chalk.yellow('Aborted.'));
        process.exit(0);
      }
    }

    // Hash password using bcryptjs
    console.log(chalk.blue('\n🔐 Hashing password...'));
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    console.log(chalk.white(`   Salt rounds: ${saltRounds}`));
    
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    console.log(chalk.green(`   Hash: ${hashedPassword}`));

    // Verify the hash immediately
    const testVerify = await bcrypt.compare(plainPassword, hashedPassword);
    console.log(chalk.white(`   Immediate verification: ${testVerify ? '✅ PASS' : '❌ FAIL'}`));

    if (!testVerify) {
      console.log(chalk.red('\n❌ Password hashing failed! Please try again.'));
      process.exit(1);
    }

    // Create admin
    console.log(chalk.blue('\n📝 Creating admin user...'));
    const admin = new AdminUser({
      name,
      email,
      password: hashedPassword,
      role,
      isActive: true,
    });
    
    await admin.save();

    // Fetch the saved admin and verify
    const savedAdmin = await AdminUser.findById(admin._id);
    const finalVerify = await bcrypt.compare(plainPassword, savedAdmin.password);
    
    console.log(chalk.green('\n✅ Admin creation completed!\n'));
    console.log(chalk.cyan('📋 Admin Details:'));
    console.log(chalk.white(`   ID: ${savedAdmin._id}`));
    console.log(chalk.white(`   Name: ${savedAdmin.name}`));
    console.log(chalk.white(`   Email: ${savedAdmin.email}`));
    console.log(chalk.white(`   Role: ${savedAdmin.role}`));
    console.log(chalk.white(`   Status: ${savedAdmin.isActive ? 'Active' : 'Inactive'}`));
    console.log(chalk.white(`   Password: ${plainPassword}`));
    console.log(chalk.blue(`\n🔐 Stored hash: ${savedAdmin.password}`));
    console.log(chalk.white(`\n🔍 Final verification: ${finalVerify ? '✅ SUCCESS' : '❌ FAILED'}\n`));

    if (finalVerify) {
      console.log(chalk.green('🎉 Login credentials:'));
      console.log(chalk.white(`   Email: ${email}`));
      console.log(chalk.white(`   Password: ${plainPassword}\n`));
      
      console.log(chalk.blue('🧪 Testing with bcrypt.compare directly:'));
      const directTest = await bcrypt.compare(plainPassword, savedAdmin.password);
      console.log(chalk.white(`   Result: ${directTest ? '✅ MATCH' : '❌ NO MATCH'}\n`));
    } else {
      console.log(chalk.red('⚠️ CRITICAL: Password verification failed!'));
      console.log(chalk.yellow('Manually reset password with:'));
      console.log(chalk.white(`node -e "const bcrypt=require('bcryptjs');const mongoose=require('mongoose');require('dotenv').config();mongoose.connect(process.env.MONGODB_URI).then(async()=>{const AdminUser=require('./models/admin/AdminUser');const hash=await bcrypt.hash('${plainPassword}',10);await AdminUser.updateOne({email:'${email}'},{password:hash});console.log('Password updated');process.exit(0);})"\n`));
    }

  } catch (err) {
    console.error(chalk.red('❌ Error creating admin:'), err);
  } finally {
    await mongoose.disconnect();
    rl.close();
    console.log(chalk.blue('👋 Disconnected from MongoDB\n'));
    process.exit(0);
  }
};

createAdmin();