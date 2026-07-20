/**
 * Creates (or resets the password of) the login user.
 * There is no registration endpoint by design — this is the only way
 * a user gets into the database.
 *
 * Usage: set SEED_USER_ID and SEED_USER_PASSWORD in .env, then:
 *   npm run seed:user
 */
import 'dotenv/config';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../modules/auth/user.model.js';

const userId = process.env.SEED_USER_ID;
const password = process.env.SEED_USER_PASSWORD;

if (!userId || !password) {
  console.error('SEED_USER_ID and SEED_USER_PASSWORD must be set in .env');
  process.exit(1);
}

if (password.length < 8) {
  console.error('SEED_USER_PASSWORD must be at least 8 characters');
  process.exit(1);
}

async function seed() {
  await connectDB();

  let user = await User.findOne({ userId: userId.toLowerCase().trim() }).select(
    '+password +tokenVersion'
  );

  if (user) {
    user.password = password;
    user.tokenVersion += 1; // revoke existing sessions on password reset
    user.isActive = true;
    await user.save();
    console.log(`🔁 Updated password for user "${user.userId}"`);
  } else {
    user = await User.create({ userId, password });
    console.log(`✅ Created user "${user.userId}"`);
  }

  await disconnectDB();
}

seed().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
