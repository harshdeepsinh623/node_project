const Task = require('../models/task');

class TaskController {
  // Create a new task
  async createTask(req, res) {
    try {
      const { title, description } = req.body;
      const newTask = new Task({ title, description, status: 'pending' });
      await newTask.save();
      res.status(201).json({ success: true, task: newTask });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get all tasks
  async getAllTasks(req, res) {
    try {
      const tasks = await Task.find();
      res.status(200).json({ success: true, tasks });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update a task
  async updateTask(req, res) {
    try {
      const { id } = req.params;
      const updatedTask = await Task.findByIdAndUpdate(id, req.body, { new: true });
      if (!updatedTask) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }
      res.status(200).json({ success: true, task: updatedTask });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Delete a task
  async deleteTask(req, res) {
    try {
      const { id } = req.params;
      const deletedTask = await Task.findByIdAndDelete(id);
      if (!deletedTask) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }
      res.status(200).json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new TaskController();