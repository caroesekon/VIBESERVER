const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const chalk = require('chalk');

// Load environment variables
dotenv.config();

// Import models
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const FriendRequest = require('../models/FriendRequest');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');
const Story = require('../models/Story');
const Hashtag = require('../models/Hashtag');
const Group = require('../models/groups/Group');
const GroupMember = require('../models/groups/GroupMember');
const GroupPost = require('../models/groups/GroupPost');
const GroupEvent = require('../models/groups/GroupEvent');
const AdminUser = require('../models/admin/AdminUser');
const Settings = require('../models/admin/Settings');

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(chalk.green(`✅ MongoDB Connected: ${conn.connection.host}`));
    return conn;
  } catch (error) {
    console.error(chalk.red(`❌ MongoDB Connection Error: ${error.message}`));
    process.exit(1);
  }
};

// Sample data generators
const generateUsers = () => {
  const users = [
    {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      bio: 'Software developer and tech enthusiast',
      location: 'New York, USA',
      website: 'https://johndoe.com',
      gender: 'male',
      avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=fff',
      coverPhoto: 'https://picsum.photos/1200/400?random=1',
    },
    {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'password123',
      bio: 'Travel blogger | Photographer',
      location: 'Los Angeles, USA',
      website: 'https://janesmith.com',
      gender: 'female',
      avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=ef4444&color=fff',
      coverPhoto: 'https://picsum.photos/1200/400?random=2',
    },
    {
      name: 'Mike Johnson',
      email: 'mike@example.com',
      password: 'password123',
      bio: 'Fitness coach | Healthy living advocate',
      location: 'Chicago, USA',
      website: 'https://mikejohnson.com',
      gender: 'male',
      avatar: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=10b981&color=fff',
      coverPhoto: 'https://picsum.photos/1200/400?random=3',
    },
    {
      name: 'Sarah Wilson',
      email: 'sarah@example.com',
      password: 'password123',
      bio: 'Food lover | Recipe creator',
      location: 'Austin, USA',
      website: 'https://sarahwilson.com',
      gender: 'female',
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Wilson&background=f59e0b&color=fff',
      coverPhoto: 'https://picsum.photos/1200/400?random=4',
    },
    {
      name: 'David Brown',
      email: 'david@example.com',
      password: 'password123',
      bio: 'Musician | Guitar player',
      location: 'Nashville, USA',
      website: 'https://davidbrown.com',
      gender: 'male',
      avatar: 'https://ui-avatars.com/api/?name=David+Brown&background=8b5cf6&color=fff',
      coverPhoto: 'https://picsum.photos/1200/400?random=5',
    },
    {
      name: 'Emma Davis',
      email: 'emma@example.com',
      password: 'password123',
      bio: 'Artist | Digital creator',
      location: 'Portland, USA',
      website: 'https://emmadavis.com',
      gender: 'female',
      avatar: 'https://ui-avatars.com/api/?name=Emma+Davis&background=ec489a&color=fff',
      coverPhoto: 'https://picsum.photos/1200/400?random=6',
    },
    {
      name: 'Chris Taylor',
      email: 'chris@example.com',
      password: 'password123',
      bio: 'Gamer | Streamer',
      location: 'Seattle, USA',
      website: 'https://christaylor.com',
      gender: 'male',
      avatar: 'https://ui-avatars.com/api/?name=Chris+Taylor&background=14b8a6&color=fff',
      coverPhoto: 'https://picsum.photos/1200/400?random=7',
    },
    {
      name: 'Olivia Martinez',
      email: 'olivia@example.com',
      password: 'password123',
      bio: 'Fashion blogger | Style influencer',
      location: 'Miami, USA',
      website: 'https://oliviamartinez.com',
      gender: 'female',
      avatar: 'https://ui-avatars.com/api/?name=Olivia+Martinez&background=06b6d4&color=fff',
      coverPhoto: 'https://picsum.photos/1200/400?random=8',
    },
  ];

  return users;
};

const generatePosts = (users) => {
  const posts = [];
  const postContents = [
    'Just finished a great workout! 💪 Feeling energized! #fitness #workout',
    'Beautiful sunset today! 🌅 #nature #photography',
    'Check out my new project! So excited to share this with everyone 🚀 #coding #developer',
    'Best coffee in town! ☕️ #coffee #morningvibes',
    'Traveling to a new city! Can\'t wait to explore ✈️ #travel #adventure',
    'New recipe I tried today! Delicious! 🍝 #foodie #cooking',
    'Learning something new every day! 📚 #learning #growth',
    'Weekend vibes! 🎉 #weekend #fun',
    'Grateful for all the amazing people in my life ❤️ #gratitude',
    'Just watched an incredible movie! Highly recommend 🎬 #movies',
    'My new artwork! What do you think? 🎨 #art #creative',
    'Morning run completed! 🏃‍♂️ #running #healthy',
    'Beautiful day for a hike! 🥾 #hiking #outdoors',
    'Trying out a new recipe tonight! #cooking #homemade',
    'So excited for the weekend! #weekendvibes #friday',
  ];

  for (let i = 0; i < 30; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const privacyOptions = ['public', 'friends', 'only-me'];
    const randomPrivacy = privacyOptions[Math.floor(Math.random() * privacyOptions.length)];
    
    posts.push({
      user: randomUser._id,
      content: postContents[Math.floor(Math.random() * postContents.length)],
      images: Math.random() > 0.7 ? [`https://picsum.photos/800/600?random=${i}`] : [],
      privacy: randomPrivacy,
      likes: [],
      comments: [],
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    });
  }

  return posts;
};

const generateComments = (posts, users) => {
  const comments = [];
  const commentContents = [
    'Great post! 👍',
    'I totally agree!',
    'Thanks for sharing!',
    'This is amazing!',
    'Love this! ❤️',
    'So true!',
    'Awesome content!',
    'Keep up the good work!',
    'Inspiring!',
    'Well said!',
  ];

  for (const post of posts) {
    const numComments = Math.floor(Math.random() * 5);
    for (let i = 0; i < numComments; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      comments.push({
        user: randomUser._id,
        post: post._id,
        content: commentContents[Math.floor(Math.random() * commentContents.length)],
        likes: [],
        createdAt: new Date(post.createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
    }
  }

  return comments;
};

// FIXED: Generate friend requests with proper sender/receiver
const generateFriendRequests = (users) => {
  const requests = [];
  const processedPairs = new Set();
  
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const pairKey = `${users[i]._id}-${users[j]._id}`;
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);
      
      // 60% chance to create a friend request between users
      if (Math.random() < 0.6) {
        const statusOptions = ['pending', 'accepted', 'rejected'];
        const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
        
        requests.push({
          sender: users[i]._id,
          receiver: users[j]._id,
          status: randomStatus,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        });
      }
    }
  }
  
  return requests;
};

const generateMessages = (users) => {
  const messages = [];
  const messageContents = [
    'Hey! How are you?',
    'What\'s up?',
    'Long time no see!',
    'Wanna grab coffee sometime?',
    'Check out my new post!',
    'Thanks for the friend request!',
    'Awesome profile!',
    'Let\'s catch up soon!',
    'Great to connect with you!',
    'Hope you\'re doing well!',
  ];

  // Create conversations first
  const conversations = [];
  const processedPairs = new Set();
  
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const pairKey = `${users[i]._id}-${users[j]._id}`;
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);
      
      // 40% chance to have conversation
      if (Math.random() < 0.4) {
        conversations.push({
          participants: [users[i]._id, users[j]._id],
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        });
      }
    }
  }

  // Create messages for each conversation
  for (const conv of conversations) {
    const numMessages = Math.floor(Math.random() * 10) + 1;
    for (let i = 0; i < numMessages; i++) {
      const sender = conv.participants[Math.floor(Math.random() * conv.participants.length)];
      const receiver = conv.participants.find(p => p.toString() !== sender.toString());
      messages.push({
        conversation: conv._id,
        sender,
        receiver,
        content: messageContents[Math.floor(Math.random() * messageContents.length)],
        read: Math.random() > 0.5,
        createdAt: new Date(conv.createdAt.getTime() + i * 60 * 60 * 1000),
      });
    }
  }

  return { conversations, messages };
};

const generateStories = (users) => {
  const stories = [];
  for (const user of users) {
    if (Math.random() > 0.6) {
      stories.push({
        user: user._id,
        media: `https://picsum.photos/400/700?random=${Math.random()}`,
        caption: Math.random() > 0.7 ? 'Check out my story!' : '',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        views: [],
        createdAt: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000),
      });
    }
  }
  return stories;
};

// FIXED: Generate hashtags with correct field name 'name'
const generateHashtags = (posts) => {
  const hashtagMap = new Map();
  
  const extractHashtags = (content) => {
    const matches = content.match(/#[\w\u0590-\u05fe]+/g) || [];
    return matches.map(tag => tag.toLowerCase().substring(1)); // Remove the # and lowercase
  };

  for (const post of posts) {
    const tags = extractHashtags(post.content);
    for (const tag of tags) {
      if (!tag) continue; // Skip empty tags
      
      if (!hashtagMap.has(tag)) {
        hashtagMap.set(tag, { 
          name: tag,  // Use 'name' field as per schema
          tag: tag,   // Keep tag field for compatibility
          count: 0, 
          posts: [] 
        });
      }
      const hashtag = hashtagMap.get(tag);
      hashtag.count++;
      if (!hashtag.posts.includes(post._id)) {
        hashtag.posts.push(post._id);
      }
    }
  }

  return Array.from(hashtagMap.values());
};

const generateGroups = (users) => {
  const groups = [];
  const groupNames = [
    'Tech Enthusiasts', 'Food Lovers', 'Travel Buddies', 'Fitness Freaks', 'Music Lovers',
    'Art Community', 'Gamers United', 'Book Club', 'Movie Buffs', 'Photography Masters',
    'Coding Ninjas', 'Startup Founders', 'Digital Marketing', 'Yoga & Meditation', 'Pet Lovers'
  ];
  const groupDescriptions = [
    'A community for tech enthusiasts to share knowledge and ideas',
    'Share your favorite recipes and food experiences',
    'Connect with fellow travelers and share your adventures',
    'Get fit together! Share workouts and fitness tips',
    'Discuss your favorite artists and discover new music',
  ];

  for (let i = 0; i < 8; i++) {
    const owner = users[Math.floor(Math.random() * users.length)];
    const privacyOptions = ['public', 'private', 'secret'];
    const randomPrivacy = privacyOptions[Math.floor(Math.random() * privacyOptions.length)];
    
    groups.push({
      name: groupNames[i % groupNames.length],
      description: groupDescriptions[i % groupDescriptions.length],
      privacy: randomPrivacy,
      topics: ['tech', 'lifestyle', 'entertainment'].slice(0, Math.floor(Math.random() * 3) + 1),
      owner: owner._id,
      admins: [owner._id],
      members: [owner._id],
      coverPhoto: `https://picsum.photos/1200/400?random=${i + 100}`,
      createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
    });
  }

  return groups;
};

const generateGroupMembers = (groups, users) => {
  const members = [];
  for (const group of groups) {
    // Add random members to each group
    const memberCount = Math.floor(Math.random() * (users.length - 1)) + 2;
    const shuffledUsers = [...users];
    for (let i = 0; i < shuffledUsers.length; i++) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledUsers[i], shuffledUsers[j]] = [shuffledUsers[j], shuffledUsers[i]];
    }
    
    const selectedUsers = shuffledUsers.slice(0, Math.min(memberCount, users.length));
    for (const user of selectedUsers) {
      if (!members.some(m => m.group === group._id && m.user === user._id)) {
        let role = 'member';
        if (user._id.toString() === group.owner.toString()) {
          role = 'owner';
        } else if (Math.random() > 0.8 && user._id.toString() !== group.owner.toString()) {
          role = 'admin';
        }
        members.push({
          group: group._id,
          user: user._id,
          role,
          joinedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        });
      }
    }
  }
  return members;
};

const generateGroupPosts = (groups, users) => {
  const posts = [];
  const postContents = [
    'Exciting news! 🎉',
    'What does everyone think about this?',
    'Looking for recommendations!',
    'Check out this awesome resource!',
    'Sharing my experience with the group',
    'Question for the community:',
    'Just wanted to say thanks to everyone!',
    'Event coming up! Who\'s interested?',
  ];

  for (const group of groups) {
    const numPosts = Math.floor(Math.random() * 10) + 5;
    const groupMembers = users.filter(u => 
      group.members.includes(u._id) || group.owner.toString() === u._id.toString()
    );
    
    for (let i = 0; i < numPosts; i++) {
      const author = groupMembers[Math.floor(Math.random() * groupMembers.length)];
      posts.push({
        group: group._id,
        user: author._id,
        content: postContents[Math.floor(Math.random() * postContents.length)] + ' ' + Math.random().toString(36).substring(7),
        images: Math.random() > 0.8 ? [`https://picsum.photos/800/600?random=${i}`] : [],
        likes: [],
        pinned: false,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    }
  }
  return posts;
};

const generateGroupEvents = (groups, users) => {
  const events = [];
  const eventTitles = [
    'Weekly Meetup', 'Virtual Hangout', 'Workshop Session', 'Group Discussion',
    'Live Q&A', 'Networking Event', 'Game Night', 'Movie Night'
  ];

  for (const group of groups) {
    if (Math.random() > 0.5) {
      const numEvents = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numEvents; i++) {
        const startDate = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000);
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
        events.push({
          group: group._id,
          createdBy: group.owner,
          title: eventTitles[Math.floor(Math.random() * eventTitles.length)],
          description: 'Join us for this exciting event!',
          location: Math.random() > 0.5 ? 'Online' : 'In-person',
          startTime: startDate,
          endTime: endDate,
          rsvps: [],
          createdAt: new Date(),
        });
      }
    }
  }
  return events;
};

const generateAdminUsers = () => {
  return [
    {
      name: 'Super Admin',
      email: 'admin@vibe.com',
      password: 'admin123',
      role: 'superadmin',
      isActive: true,
    },
    {
      name: 'Moderator',
      email: 'moderator@vibe.com',
      password: 'mod123',
      role: 'moderator',
      isActive: true,
    },
  ];
};

const initializeSettings = async () => {
  const defaultSettings = [
    { key: 'siteName', value: 'Vibe Social' },
    { key: 'siteDescription', value: 'Connect with friends and share your moments' },
    { key: 'siteEmail', value: 'support@vibe.com' },
    { key: 'maintenanceMode', value: false },
    { key: 'allowRegistration', value: true },
    { key: 'emailVerification', value: false },
    { key: 'maxPostImages', value: 10 },
    { key: 'maxFileSize', value: 10485760 },
    { key: 'defaultPrivacy', value: 'public' },
    { key: 'postsPerPage', value: 10 },
    { key: 'storiesDuration', value: 24 },
    { key: 'rateLimitPerMinute', value: 60 },
  ];

  for (const setting of defaultSettings) {
    await Settings.findOneAndUpdate(
      { key: setting.key },
      { key: setting.key, value: setting.value },
      { upsert: true }
    );
  }
  console.log(chalk.blue('✅ Default settings initialized'));
};

// Clear all collections
const clearCollections = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  console.log(chalk.blue('✅ All collections cleared'));
};

// Main seed function
const seedDatabase = async () => {
  try {
    console.log(chalk.yellow('\n🌱 Starting database seeding...\n'));

    // Clear all existing data
    await clearCollections();

    // Generate and insert users
    console.log(chalk.blue('Creating users...'));
    const usersData = generateUsers();
    const hashedUsers = await Promise.all(usersData.map(async (user) => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      return { ...user, password: hashedPassword };
    }));
    const users = await User.insertMany(hashedUsers);
    console.log(chalk.green(`✅ Created ${users.length} users`));

    // Generate and insert posts
    console.log(chalk.blue('Creating posts...'));
    const postsData = generatePosts(users);
    const posts = await Post.insertMany(postsData);
    console.log(chalk.green(`✅ Created ${posts.length} posts`));

    // Generate and insert comments
    console.log(chalk.blue('Creating comments...'));
    const commentsData = generateComments(posts, users);
    const comments = await Comment.insertMany(commentsData);
    console.log(chalk.green(`✅ Created ${comments.length} comments`));

    // Update posts with comment references
    for (const comment of comments) {
      await Post.findByIdAndUpdate(comment.post, { $push: { comments: comment._id } });
    }

    // Generate and insert friend requests (FIXED)
    console.log(chalk.blue('Creating friend relationships...'));
    const requestsData = generateFriendRequests(users);
    
    // Insert each request individually to avoid duplicate key errors
    let acceptedRequests = [];
    for (const req of requestsData) {
      try {
        const existing = await FriendRequest.findOne({
          sender: req.sender,
          receiver: req.receiver
        });
        if (!existing) {
          await FriendRequest.create(req);
          if (req.status === 'accepted') {
            acceptedRequests.push(req);
          }
        }
      } catch (err) {
        // Skip duplicates
      }
    }
    
    // Update user friend lists for accepted requests
    for (const req of acceptedRequests) {
      await User.findByIdAndUpdate(req.sender, { $addToSet: { friends: req.receiver } });
      await User.findByIdAndUpdate(req.receiver, { $addToSet: { friends: req.sender } });
    }
    console.log(chalk.green(`✅ Created ${acceptedRequests.length} friend connections`));

    // Generate and insert messages
    console.log(chalk.blue('Creating messages...'));
    const { conversations, messages } = generateMessages(users);
    if (conversations.length) {
      const insertedConvs = await Conversation.insertMany(conversations);
      const messagesWithConvIds = messages.map((msg, idx) => ({
        ...msg,
        conversation: insertedConvs[Math.floor(idx / 10) % insertedConvs.length]._id
      }));
      await Message.insertMany(messagesWithConvIds);
      console.log(chalk.green(`✅ Created ${conversations.length} conversations and ${messages.length} messages`));
    }

    // Generate and insert stories
    console.log(chalk.blue('Creating stories...'));
    const storiesData = generateStories(users);
    await Story.insertMany(storiesData);
    console.log(chalk.green(`✅ Created ${storiesData.length} stories`));

    // Generate and insert hashtags (FIXED)
    console.log(chalk.blue('Creating hashtags...'));
    const hashtagsData = generateHashtags(posts);
    if (hashtagsData.length) {
      let insertedCount = 0;
      for (const hashtag of hashtagsData) {
        try {
          const existing = await Hashtag.findOne({ name: hashtag.name });
          if (!existing) {
            await Hashtag.create(hashtag);
            insertedCount++;
          } else {
            // Update existing hashtag count and posts
            existing.count += hashtag.count;
            existing.posts = [...new Set([...existing.posts, ...hashtag.posts])];
            await existing.save();
            insertedCount++;
          }
        } catch (err) {
          // Skip duplicates silently
        }
      }
      console.log(chalk.green(`✅ Created/Updated ${insertedCount} hashtags`));
    } else {
      console.log(chalk.yellow('⚠️ No hashtags found in posts'));
    }

    // Generate and insert groups
    console.log(chalk.blue('Creating groups...'));
    const groupsData = generateGroups(users);
    const groups = await Group.insertMany(groupsData);
    console.log(chalk.green(`✅ Created ${groups.length} groups`));

    // Generate and insert group members
    console.log(chalk.blue('Adding group members...'));
    const membersData = generateGroupMembers(groups, users);
    await GroupMember.insertMany(membersData);
    console.log(chalk.green(`✅ Added ${membersData.length} group memberships`));

    // Generate and insert group posts
    console.log(chalk.blue('Creating group posts...'));
    const groupPostsData = generateGroupPosts(groups, users);
    await GroupPost.insertMany(groupPostsData);
    console.log(chalk.green(`✅ Created ${groupPostsData.length} group posts`));

    // Generate and insert group events
    console.log(chalk.blue('Creating group events...'));
    const eventsData = generateGroupEvents(groups, users);
    await GroupEvent.insertMany(eventsData);
    console.log(chalk.green(`✅ Created ${eventsData.length} group events`));

    // Generate and insert admin users
    console.log(chalk.blue('Creating admin users...'));
    const adminData = generateAdminUsers();
    const hashedAdmins = await Promise.all(adminData.map(async (admin) => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(admin.password, salt);
      return { ...admin, password: hashedPassword };
    }));
    await AdminUser.insertMany(hashedAdmins);
    console.log(chalk.green(`✅ Created ${hashedAdmins.length} admin users`));

    // Initialize settings
    await initializeSettings();

    console.log(chalk.green('\n✨ Database seeding completed successfully!\n'));
    
    // Display summary
    console.log(chalk.cyan('📊 Database Summary:'));
    console.log(chalk.white(`   Users: ${users.length}`));
    console.log(chalk.white(`   Posts: ${posts.length}`));
    console.log(chalk.white(`   Comments: ${comments.length}`));
    console.log(chalk.white(`   Friend Connections: ${acceptedRequests.length}`));
    console.log(chalk.white(`   Messages: ${messages.length}`));
    console.log(chalk.white(`   Stories: ${storiesData.length}`));
    console.log(chalk.white(`   Hashtags: ${hashtagsData.length}`));
    console.log(chalk.white(`   Groups: ${groups.length}`));
    console.log(chalk.white(`   Group Memberships: ${membersData.length}`));
    console.log(chalk.white(`   Group Posts: ${groupPostsData.length}`));
    console.log(chalk.white(`   Group Events: ${eventsData.length}`));
    console.log(chalk.white(`   Admin Users: ${hashedAdmins.length}\n`));
    
    console.log(chalk.yellow('🔐 Test Login Credentials:'));
    console.log(chalk.white('   User: john@example.com / password123'));
    console.log(chalk.white('   User: jane@example.com / password123'));
    console.log(chalk.white('   Admin: admin@vibe.com / admin123'));
    console.log(chalk.white('   Moderator: moderator@vibe.com / mod123\n'));

  } catch (error) {
    console.error(chalk.red('❌ Seeding error:'), error);
    process.exit(1);
  }
};

// Run seed
const runSeed = async () => {
  await connectDB();
  await seedDatabase();
  await mongoose.disconnect();
  console.log(chalk.yellow('👋 Database disconnected'));
  process.exit(0);
};

// Execute
runSeed();