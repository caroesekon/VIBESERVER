const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const chalk = require('chalk');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Settings = require('../models/admin/Settings');

const defaultSettings = [
  // General Settings
  { key: 'siteName', value: 'Vibe Social', group: 'general' },
  { key: 'siteDescription', value: 'Connect with friends and share your moments', group: 'general' },
  { key: 'siteEmail', value: 'support@vibe.com', group: 'general' },
  { key: 'maintenanceMode', value: false, group: 'general' },
  { key: 'allowRegistration', value: true, group: 'general' },
  
  // Legal Settings
  { key: 'termsOfService', value: `## Terms of Service

Welcome to Vibe Social Media Platform. By using our service, you agree to these terms.

### 1. Acceptance of Terms

By accessing or using Vibe, you agree to be bound by these Terms of Service.

### 2. User Conduct

You agree not to:
- Post illegal, harmful, or abusive content
- Harass or bully other users
- Impersonate others
- Use bots or automated tools
- Share private information without consent

### 3. Content Ownership

You retain ownership of content you post. By posting, you grant Vibe a license to display and distribute your content.

### 4. Termination

We may terminate accounts that violate these terms.

### 5. Changes to Terms

We may update these terms. Continued use means acceptance.

### 6. Contact

Questions? Email legal@vibe.com`, group: 'legal' },
  
  { key: 'privacyPolicy', value: `## Privacy Policy

Your privacy is important to us. This policy explains how we collect, use, and protect your data.

### Information We Collect

- **Account Info**: Name, email, phone number
- **Content**: Posts, messages, photos, videos
- **Usage Data**: Interactions, preferences
- **Device Info**: Browser, IP address, device type

### How We Use Your Information

- Provide and improve our services
- Personalize your experience
- Communicate with you
- Ensure platform security
- Comply with legal obligations

### Information Sharing

We do not sell your personal information. We may share data:
- With your consent
- For legal requirements
- With service providers

### Your Rights

- Access your data
- Correct inaccurate data
- Delete your account
- Opt out of marketing

### Data Security

We implement industry-standard security measures to protect your data.

### Children's Privacy

Our service is not intended for users under 13.

### Changes to Policy

We will notify you of material changes.

### Contact

Privacy questions: privacy@vibe.com`, group: 'legal' },
  
  { key: 'aboutContent', value: `## About Vibe

Vibe is a social media platform designed to connect people, share moments, and build communities.

### Our Mission

To bring people closer together through meaningful connections and authentic interactions.

### Our Story

Founded in 2024, Vibe was created with a simple idea: social media should bring joy, not stress.

### Our Values

- **Community First**: Your safety is our top priority
- **Authenticity**: Real connections with real people
- **Innovation**: Constantly improving your experience
- **Transparency**: Open communication
- **Inclusivity**: A platform for everyone

### Features

- 📝 Share posts with photos and videos
- 💬 Real-time messaging with friends
- 👥 Create and join groups
- 📺 Watch and share videos
- 🛒 Buy and sell in Marketplace
- 📸 24-hour stories

### Contact Us

**Support**: support@vibe.com
**Business**: business@vibe.com

© 2024 Vibe Social Media. All rights reserved.`, group: 'legal' },
  
  { key: 'helpContent', value: `## Help Center

Welcome to the Vibe Help Center!

### Getting Started

#### How do I create an account?
1. Click "Sign Up" on the login page
2. Enter your name, email, and phone number
3. Create a strong password
4. Agree to our Terms of Service
5. Click "Create Account"

#### How do I log in?
- Use your registered email or phone number
- Enter your password
- Check "Remember Me" to stay logged in

### Posts & Sharing

#### How do I create a post?
1. Click the "What's on your mind?" box at the top of your feed
2. Type your content
3. Add photos or videos (optional)
4. Choose privacy setting (Public, Friends, Only Me)
5. Click "Post"

#### How do I edit or delete a post?
- Click the three dots (•••) on your post
- Select "Edit" or "Delete"
- Confirm your action

### Friends & Connections

#### How do I add friends?
1. Search for users by name
2. Visit their profile
3. Click "Add Friend"
4. Wait for them to accept

#### How do I accept friend requests?
1. Click the Friends icon in the header
2. Go to "Requests" tab
3. Click "Accept" or "Decline"

### Messaging

#### How do I send a message?
1. Click the Messages icon
2. Select a conversation or start a new one
3. Type your message
4. Press Enter or click Send

### Groups

#### How do I create a group?
1. Go to Groups page
2. Click "Create Group"
3. Enter group name and description
4. Choose privacy setting
5. Add topics
6. Click "Create"

### Privacy & Safety

#### How do I report inappropriate content?
1. Click the three dots (•••) on the post/comment
2. Select "Report"
3. Choose a reason
4. Submit

### Still Need Help?

Contact our support team: **support@vibe.com**

We typically respond within 24-48 hours.`, group: 'legal' },
  
  { key: 'adChoicesContent', value: `## Ad Choices

Vibe is free thanks to advertising. This page explains your choices.

### How Advertising Works

We show relevant ads based on:
- Demographics (age, location)
- Interests (pages you like, content you engage with)
- Your activity on Vibe

### Your Choices

You can control ad personalization:
1. Go to Settings > Privacy > Ad Preferences
2. Adjust your interests
3. Opt out of personalized ads

### Types of Ads

- **Sponsored Posts**: Posts from brands in your feed
- **Display Ads**: Banners or sidebars
- **Video Ads**: Short advertisements before or during video content

### Report an Ad

If you see an inappropriate ad:
1. Click the three dots on the ad
2. Select "Report Ad"
3. Choose a reason

### Contact

For advertising inquiries: ads@vibe.com
For privacy concerns: privacy@vibe.com

Last Updated: January 2024`, group: 'legal' },
  
  // Feature Settings
  { key: 'maxPostImages', value: 10, group: 'features' },
  { key: 'maxFileSize', value: 10485760, group: 'features' },
  { key: 'postsPerPage', value: 10, group: 'features' },
];

const initSettings = async () => {
  try {
    console.log(chalk.blue('\n🔌 Connecting to MongoDB...'));
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(chalk.green('✅ Connected to MongoDB\n'));

    console.log(chalk.blue('📝 Initializing default settings...\n'));
    
    for (const setting of defaultSettings) {
      await Settings.findOneAndUpdate(
        { key: setting.key },
        { $set: setting },
        { upsert: true, new: true }
      );
      console.log(chalk.white(`   ✓ ${setting.key}`));
    }
    
    const count = await Settings.countDocuments();
    console.log(chalk.green(`\n✅ Default settings initialized successfully!`));
    console.log(chalk.white(`   Total settings in database: ${count}\n`));
    
  } catch (error) {
    console.error(chalk.red('❌ Error initializing settings:'), error);
  } finally {
    await mongoose.disconnect();
    console.log(chalk.blue('👋 Disconnected from MongoDB\n'));
    process.exit(0);
  }
};

initSettings();