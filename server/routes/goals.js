import express from 'express';
import { Goal } from '../models/Goal.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Create a new goal
router.post('/', async (req, res) => {
  try {
    const goalData = req.body;
    const goal = Goal.create(req.user.id, goalData);
    res.status(201).json(goal);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all goals for the user
router.get('/', async (req, res) => {
  try {
    const { status, orderBy } = req.query;
    const filters = {};
    
    if (status) filters.status = status;
    
    const goals = Goal.filter(req.user.id, filters, orderBy || 'created_date DESC');
    res.json(goals);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific goal
router.get('/:id', async (req, res) => {
  try {
    const goal = Goal.findById(req.params.id);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(goal);
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a goal
router.put('/:id', async (req, res) => {
  try {
    const goalData = req.body;
    const goal = Goal.update(req.params.id, goalData);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(goal);
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a goal
router.delete('/:id', async (req, res) => {
  try {
    const deleted = Goal.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.status(204).send(); // 204 No Content for successful deletion
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;