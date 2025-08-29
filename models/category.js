const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    minlength: [2, 'Category name must be at least 2 characters'],
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  color: {
    type: String,
    default: '#007bff',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color code']
  },
  icon: {
    type: String,
    default: 'folder',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // For nested categories (optional)
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
categorySchema.index({ name: 1, createdBy: 1 }, { unique: true });
categorySchema.index({ createdBy: 1 });
categorySchema.index({ parent: 1 });

// Virtual for task count
categorySchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Pre-remove middleware to handle cascade delete
categorySchema.pre('remove', async function(next) {
  try {
    // Update tasks that reference this category to null
    await mongoose.model('Task').updateMany(
      { category: this._id },
      { category: null }
    );
    
    // Update child categories to have no parent
    await mongoose.model('Category').updateMany(
      { parent: this._id },
      { parent: null }
    );
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to get categories with task counts
categorySchema.statics.getCategoriesWithTaskCount = function(userId) {
  return this.aggregate([
    { $match: { createdBy: mongoose.Types.ObjectId(userId), isActive: true } },
    {
      $lookup: {
        from: 'tasks',
        localField: '_id',
        foreignField: 'category',
        as: 'tasks'
      }
    },
    {
      $addFields: {
        taskCount: { $size: '$tasks' }
      }
    },
    {
      $project: {
        tasks: 0
      }
    },
    { $sort: { name: 1 } }
  ]);
};

module.exports = mongoose.model('Category', categorySchema);