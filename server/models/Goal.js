import { runQuery, runQuerySingle, runQueryExec } from './database.js';

export class Goal {
  static async create(userId, data) {
    const result = await runQueryExec(`
      INSERT INTO goals (user_id, title, description, status)
      VALUES (?, ?, ?, ?)
    `, [
      userId,
      data.title,
      data.description || null,
      data.status || 'active'
    ]);
    
    return this.findById(result.id);
  }

  static async findById(id) {
    return await runQuerySingle('SELECT * FROM goals WHERE id = ?', [id]);
  }

  static async findByUserId(userId, filters = {}, orderBy = 'created_date DESC') {
    let query = 'SELECT * FROM goals WHERE user_id = ?';
    let params = [userId];
    
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    query += ` ORDER BY ${orderBy}`;
    
    return await runQuery(query, params);
  }

  static async update(id, data) {
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
    
    await runQueryExec(`
      UPDATE goals SET ${fields.join(', ')} WHERE id = ?
    `, values);
    
    return this.findById(id);
  }

  static async delete(id) {
    const result = await runQueryExec('DELETE FROM goals WHERE id = ?', [id]);
    return result.changes > 0;
  }

  static async list(userId, orderBy = 'created_date DESC') {
    return this.findByUserId(userId, {}, orderBy);
  }

  static async filter(userId, filters, orderBy = 'created_date DESC') {
    return this.findByUserId(userId, filters, orderBy);
  }
}