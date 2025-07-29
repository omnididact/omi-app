import db from './database.js';

export class Goal {
  static create(userId, data) {
    const stmt = db.prepare(`
      INSERT INTO goals (user_id, title, description, status)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      userId,
      data.title,
      data.description || null,
      data.status || 'active'
    );
    
    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM goals WHERE id = ?');
    return stmt.get(id);
  }

  static findByUserId(userId, filters = {}, orderBy = 'created_date DESC') {
    let query = 'SELECT * FROM goals WHERE user_id = ?';
    let params = [userId];
    
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    query += ` ORDER BY ${orderBy}`;
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  static update(id, data) {
    const fields = [];
    const values = [];
    
    const updateFields = ['title', 'description', 'status'];
    
    updateFields.forEach(field => {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    });
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const stmt = db.prepare(`
      UPDATE goals SET ${fields.join(', ')} WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.findById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM goals WHERE id = ?');
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