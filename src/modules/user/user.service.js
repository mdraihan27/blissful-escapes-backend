import { User } from '../auth/user.model.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * All users, newest first. Only the non-sensitive fields the admin list
 * needs — password and the security counters are never selected.
 */
export async function listUsers() {
  const users = await User.find()
    .select('userId isActive lastLoginAt createdBy createdAt')
    .sort({ createdAt: -1 });

  return users;
}

export async function createUser({ userId, password }, createdBy) {
  const normalizedId = userId.toLowerCase().trim();

  const existing = await User.findOne({ userId: normalizedId }).select('_id');
  if (existing) {
    throw ApiError.badRequest('A user with that ID already exists');
  }

  const user = await User.create({
    userId: normalizedId,
    password,
    createdBy: createdBy ?? null,
  });

  // Return only the safe fields, shaped like the list rows
  return {
    _id: user._id,
    userId: user.userId,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdBy: user.createdBy,
    createdAt: user.createdAt,
  };
}
