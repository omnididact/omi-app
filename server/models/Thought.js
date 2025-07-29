import db from './database.js';

export class Thought {
  static create(userId, data) {
    const stmt = db.prepare(`
      INSERT INTO thoughts (
        user_id, transcription, processed_text, category, sub_category,
        mood_score, priority, tags, action_steps, status, task_status, requires_triage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
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
    );
    
    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM thoughts WHERE id = ?');
    const thought = stmt.get(id);
    
    if (thought) {
      thought.tags = JSON.parse(thought.tags || '[]');
      thought.action_steps = JSON.parse(thought.action_steps || '[]');
      thought.requires_triage = Boolean(thought.requires_triage);  // Convert back to boolean
    }
    
    return thought;
  }

  static findByUserId(userId, filters = {}, orderBy = 'created_date DESC') {
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
    
    const stmt = db.prepare(query);
    const thoughts = stmt.all(...params);
    
    return thoughts.map(thought => ({
      ...thought,
      tags: JSON.parse(thought.tags || '[]'),
      action_steps: JSON.parse(thought.action_steps || '[]'),
      requires_triage: Boolean(thought.requires_triage)  // Convert back to boolean
    }));
  }

  static update(id, data) {
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
    
    const stmt = db.prepare(`
      UPDATE thoughts SET ${fields.join(', ')} WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.findById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM thoughts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static list(userId, orderBy = 'created_date DESC') {
    return this.findByUserId(userId, {}, orderBy);
  }

  static filter(userId, filters, orderBy = 'created_date DESC') {
    return this.findByUserId(userId, filters, orderBy);
  }
}