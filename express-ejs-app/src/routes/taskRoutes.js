const express = require('express');
const TaskController = require('../controllers/taskController');

const router = express.Router();
const taskController = new TaskController();

// Route to get all tasks
router.get('/', taskController.getAllTasks);

// Route to get a form for creating a new task
router.get('/new', taskController.getTaskForm);

// Route to create a new task
router.post('/', taskController.createTask);

// Route to get a specific task for editing
router.get('/:id/edit', taskController.getEditTaskForm);

// Route to update a specific task
router.put('/:id', taskController.updateTask);

// Route to delete a specific task
router.delete('/:id', taskController.deleteTask);

module.exports = router;