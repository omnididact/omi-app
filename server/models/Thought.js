import { runQuery, runQuerySingle, runQueryExec } from './database.js';

export class Thought {
  static async create(userId, data) {
    const result = await runQueryExec(`
      INSERT INTO thoughts (
        user_id, transcription, processed_text, category, sub_category,
        mood_score, priority, tags, action_steps, status, task_status, requires_triage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      data.transcription || null,
      data.processed_text || null,
      data.category || null,
      data.sub_category || null,
      data.mood_score || null,
      data.priority || 'medium',
      JSON.stringify(data.tags || []),
      JSON.stringify(data.action_steps || []),
      data.status || 'pending',
      data.task_status || null,
      (data.requires_triage !== undefined ? data.requires_triage : false) ? 1 : 0  // Convert boolean to integer for SQLite
    ]);
    
    return this.findById(result.id);
  }

  static async findById(id) {
    const thought = await runQuerySingle('SELECT * FROM thoughts WHERE id = ?', [id]);
    
    if (thought) {
      thought.tags = JSON.parse(thought.tags || '[]');
      thought.action_steps = JSON.parse(thought.action_steps || '[]');
      thought.requires_triage = Boolean(thought.requires_triage);  // Convert back to boolean
    }
    
    return thought;
  }

  static async findByUserId(userId, filters = {}, orderBy = 'created_date DESC') {
    let query = 'SELECT * FROM thoughts WHERE user_id = ?';
    let params = [userId];
    
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    
    if (filters.priority) {
      query += ' AND priority = ?';
      params.push(filters.priority);
    }
    
    query += ` ORDER BY ${orderBy}`;
    
    const thoughts = await runQuery(query, params);
    
    return thoughts.map(thought => ({
      ...thought,
      tags: JSON.parse(thought.tags || '[]'),
      action_steps: JSON.parse(thought.action_steps || '[]'),
      requires_triage: Boolean(thought.requires_triage)  // Convert back to boolean
    }));
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    
    const updateFields = [
      'transcription', 'processed_text', 'category', 'sub_category',
      'mood_score', 'priority', 'status', 'task_status', 'requires_triage'
    ];
    
    updateFields.forEach(field => {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        if (field === 'requires_triage') {
          values.push(data[field] ? 1 : 0);  // Convert boolean to integer for SQLite
        } else {
          values.push(data[field]);
        }
      }
    });
    
    if (data.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(data.tags));
    }
    
    if (data.action_steps !== undefined) {
      fields.push('action_steps = ?');
      values.push(JSON.stringify(data.action_steps));
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await runQueryExec(`
      UPDATE thoughts SET ${fields.join(', ')} WHERE id = ?
    `, values);
    
    return this.findById(id);
  }

  static async delete(id) {
    const result = await runQueryExec('DELETE FROM thoughts WHERE id = ?', [id]);
    return result.changes > 0;
  }

  static async list(userId, orderBy = 'created_date DESC') {
    return this.findByUserId(userId, {}, orderBy);
  }

  static async filter(userId, filters, orderBy = 'created_date DESC') {
    return this.findByUserId(userId, filters, orderBy);
  }
}