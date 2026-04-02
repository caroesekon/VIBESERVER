const Story = require('../models/Story');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Create a story
// @route   POST /api/stories
const createStory = async (req, res) => {
  try {
    const { media, caption, type = 'image' } = req.body;
    if (!media) {
      return res.status(400).json({ success: false, message: 'Media required' });
    }

    const story = await Story.create({
      user: req.user._id,
      media,
      caption: caption || '',
      type,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    await story.populate('user', 'name avatar');
    res.status(201).json({ success: true, data: story });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get stories from friends and self
// @route   GET /api/stories
const getStories = async (req, res) => {
  try {
    // Get user's friends list
    const user = await User.findById(req.user._id).select('friends');
    const friendIds = user?.friends || [];
    const allUserIds = [...friendIds, req.user._id];

    // Get stories from friends and self that haven't expired
    const stories = await Story.find({
      user: { $in: allUserIds },
      expiresAt: { $gt: new Date() }
    })
      .populate('user', 'name avatar')
      .sort('-createdAt')
      .lean();

    // Add user reaction for each story
    const storiesWithReactions = stories.map(story => {
      const userReaction = story.reactions?.find(r => r.user?.toString() === req.user._id.toString());
      return {
        ...story,
        userReaction: userReaction?.type || null
      };
    });

    // Group by user
    const grouped = {};
    storiesWithReactions.forEach(story => {
      if (story.user && story.user._id) {
        const userId = story.user._id.toString();
        if (!grouped[userId]) {
          grouped[userId] = {
            user: story.user,
            stories: []
          };
        }
        grouped[userId].stories.push(story);
      }
    });

    res.json({ success: true, data: Object.values(grouped) });
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get story viewers
// @route   GET /api/stories/viewers/:id
const getStoryViewers = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid story ID' });
    }
    
    const story = await Story.findById(id)
      .populate('views.user', 'name avatar')
      .populate('reactions.user', 'name avatar')
      .lean();

    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    // Combine viewers and reactors
    const viewersMap = new Map();

    story.views?.forEach(view => {
      if (view.user) {
        viewersMap.set(view.user._id.toString(), {
          ...view.user,
          viewedAt: view.viewedAt,
          reaction: null
        });
      }
    });

    story.reactions?.forEach(reaction => {
      if (reaction.user) {
        const existing = viewersMap.get(reaction.user._id.toString());
        if (existing) {
          existing.reaction = {
            type: reaction.type,
            emoji: getReactionEmoji(reaction.type)
          };
        } else {
          viewersMap.set(reaction.user._id.toString(), {
            ...reaction.user,
            viewedAt: reaction.reactedAt,
            reaction: {
              type: reaction.type,
              emoji: getReactionEmoji(reaction.type)
            }
          });
        }
      }
    });

    const viewers = Array.from(viewersMap.values()).sort((a, b) => 
      new Date(b.viewedAt) - new Date(a.viewedAt)
    );

    res.json({ success: true, data: viewers });
  } catch (error) {
    console.error('Get story viewers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Helper function to get emoji for reaction type
const getReactionEmoji = (type) => {
  const emojis = {
    like: '👍',
    love: '❤️',
    haha: '😂',
    wow: '😮',
    sad: '😢',
    angry: '😠'
  };
  return emojis[type] || '👍';
};

// @desc    React to a story
// @route   POST /api/stories/:id/react
const reactToStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { reaction } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid story ID' });
    }

    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    if (!story.reactions) story.reactions = [];

    // Check if user already reacted
    const existingReactionIndex = story.reactions.findIndex(r => r.user.toString() === userId.toString());

    if (existingReactionIndex !== -1) {
      if (story.reactions[existingReactionIndex].type === reaction) {
        story.reactions.splice(existingReactionIndex, 1);
      } else {
        story.reactions[existingReactionIndex].type = reaction;
        story.reactions[existingReactionIndex].reactedAt = new Date();
      }
    } else {
      story.reactions.push({ user: userId, type: reaction });
    }

    await story.save();

    res.json({ success: true, message: 'Reaction added' });
  } catch (error) {
    console.error('React to story error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a story
// @route   DELETE /api/stories/:id
const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid story ID' });
    }
    
    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }
    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await story.deleteOne();
    res.json({ success: true });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Mark story as viewed
// @route   POST /api/stories/:id/view
const viewStory = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid story ID' });
    }
    
    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    // Avoid duplicate views
    const alreadyViewed = story.views?.some(v => v.user.toString() === req.user._id.toString());
    if (!alreadyViewed) {
      story.views.push({ user: req.user._id });
      await story.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createStory,
  getStories,
  getStoryViewers,
  reactToStory,
  deleteStory,
  viewStory
};