import { BaseRepository } from './BaseRepository.js';
import User from '../models/User.js';

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return this.findOne({ email: email.toLowerCase() });
  }

  async findByEmailWithPassword(email) {
    return this.model.findOne({ email: email.toLowerCase() }).select('+passwordHash').lean();
  }

  async findByResetToken(tokenHash) {
    return this.findOne({ passwordResetToken: tokenHash, passwordResetExpires: { $gt: new Date() } });
  }

  async updateLastLogin(userId) {
    return this.updateById(userId, { lastLoginAt: new Date() });
  }

  async setPasswordResetToken(userId, tokenHash, expires) {
    return this.updateById(userId, { passwordResetToken: tokenHash, passwordResetExpires: expires });
  }

  async clearPasswordResetToken(userId) {
    return this.updateById(userId, { passwordResetToken: null, passwordResetExpires: null });
  }
}

export default new UserRepository();