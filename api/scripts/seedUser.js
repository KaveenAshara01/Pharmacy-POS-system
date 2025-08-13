
import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';

(async () => {
  try {
    const args = process.argv.slice(2);
    let username = null;
    let password = null;
    let role = 'admin';

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--username' && args[i + 1]) username = args[++i];
      if (args[i] === '--password' && args[i + 1]) password = args[++i];
      if (args[i] === '--role' && args[i + 1]) role = args[++i];
    }

    if (!username || !password) {
      console.error('Usage: npm run seed:user -- --username <name> --password <pass> [--role admin|user]');
      process.exit(1);
    }

    await connectDB(process.env.MONGO_URI);

    const existing = await User.findOne({ username });
    if (existing) {
      console.error('User already exists:', username);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, passwordHash, role });
    console.log('✅ Created user:', { id: user._id.toString(), username: user.username, role: user.role });

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
})();
