/**
 * One-off script to create (or update) the default admin account.
 * This replaces the hardcoded admin credentials in the frontend.
 *
 * Run with:  npm run seed:admin
 *
 * Override the defaults with environment variables if you like:
 *   ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD
 */
require('dotenv').config();

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const User = require('../models/User');

const ADMIN_NAME = process.env.ADMIN_NAME || 'Voice2Law Admin';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@voice2law.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Voice2Law@Admin2024!';

async function run() {
  await connectDB();

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await User.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    { name: ADMIN_NAME, email: ADMIN_EMAIL, passwordHash, role: 'admin' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('Admin account ready:');
  console.log(`  email:    ${admin.email}`);
  console.log(`  password: ${ADMIN_PASSWORD}`);
  console.log('Change the password in production!');

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed to seed admin:', err.message);
  process.exit(1);
});
