const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const BanList = require('../models/admin/BanList');

dotenv.config();

const resetAllBans = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Set all users to not banned
    const result = await User.updateMany(
      {},
      { $set: { isBanned: false } }
    );
    console.log(`✅ Updated ${result.modifiedCount} users to isBanned: false`);

    // 2. Delete all active ban records (or set them to inactive)
    const banResult = await BanList.updateMany(
      { active: true },
      { $set: { active: false, unbannedAt: new Date() } }
    );
    console.log(`✅ Deactivated ${banResult.modifiedCount} ban records`);

    // 3. Verify the changes
    const users = await User.find({}, { name: 1, email: 1, isBanned: 1 });
    console.log('\n📊 Current user status:');
    users.forEach(user => {
      console.log(`   ${user.email}: ${user.isBanned ? 'BANNED' : 'ACTIVE'}`);
    });

    const activeBans = await BanList.countDocuments({ active: true });
    console.log(`\n📊 Active bans in BanList: ${activeBans}`);

    await mongoose.disconnect();
    console.log('\n✅ All bans have been reset successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

resetAllBans();