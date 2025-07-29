import express from 'express';
import { Thought } from '../models/Thought.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Create a new thought
router.post('/', async (req, res) => {
  try {
    const thoughtData = req.body;
    
    // Validate required fields
    if (!thoughtData.processed_text || !thoughtData.category) {
      return res.status(400).json({ 
        error: 'Missing required fields: processed_text and category are required' 
      });
    }
    
    const thought = await Thought.create(req.user.id, thoughtData);
    res.status(201).json(thought);
  } catch (error) {
    console.error('Create thought error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all thoughts for the user
router.get('/', async (req, res) => {
  try {
    const { status, category, priority, orderBy } = req.query;
    const filters = {};
    
    if (status) filters.status = status;
    if (category) filters.category = category;
    if (priority) filters.priority = priority;
    
    const thoughts = await Thought.filter(req.user.id, filters, orderBy || 'created_date DESC');
    res.json(thoughts);
  } catch (error) {
    console.error('Get thoughts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific thought
router.get('/:id', async (req, res) => {
  try {
    const thought = await Thought.findById(req.params.id);
    if (!thought) {
      return res.status(404).json({ error: 'Thought not found' });
    }
    res.json(thought);
  } catch (error) {
    console.error('Get thought error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a thought
router.put('/:id', async (req, res) => {
  try {
    const thoughtData = req.body;
    const thought = await Thought.update(req.params.id, thoughtData);
    if (!thought) {
      return res.status(404).json({ error: 'Thought not found' });
    }
    res.json(thought);
  } catch (error) {
    console.error('Update thought error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a thought
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Thought.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Thought not found' });
    }
    res.status(204).send(); // 204 No Content for successful deletion
  } catch (error) {
    console.error('Delete thought error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;