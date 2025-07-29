import { runQuery, runQuerySingle, runQueryExec } from './database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

export class User {
  static async create({ email, name, password }) {
    const passwordHash = bcrypt.hashSync(password, 10);
    
    const result = await runQueryExec(`
      INSERT INTO users (email, name, password_hash)
      VALUES (?, ?, ?)
    `, [email, name, passwordHash]);
    
    return this.findById(result.id);
  }

  static async findById(id) {
    const user = await runQuerySingle('SELECT * FROM users WHERE id = ?', [id]);
    if (user) {
      delete user.password_hash;
    }
    return user;
  }

  static async findByEmail(email) {
    return await runQuerySingle('SELECT * FROM users WHERE email = ?', [email]);
  }

  static async authenticate(email, password) {
    const user = await this.findByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return null;
    }
    
    delete user.password_hash;
    return user;
  }

  static generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    
    if (data.name) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.email) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.password) {
      fields.push('password_hash = ?');
      values.push(bcrypt.hashSync(data.password, 10));
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await runQueryExec(`
      UPDATE users SET ${fields.join(', ')} WHERE id = ?
    `, values);
    
    return this.findById(id);
  }
}