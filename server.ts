import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure we have a DATABASE_URL for Postgres
if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL is not set. The application requires a PostgreSQL connection string to start properly. - server.ts:20");
}

const poolConfig: any = {
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
};
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    if(!process.env.DATABASE_URL.includes('localhost')){
       poolConfig.ssl = { rejectUnauthorized: false };
    }
}

const pool = new Pool(poolConfig);

const JWT_SECRET = process.env.JWT_SECRET || 'unifound-secret-key-2024';

// Helper to create notifications
const createNotification = async (userId: string, title: string, message: string) => {
  try {
    const id = Math.random().toString(36).substring(2, 15);
    await pool.query(
      'INSERT INTO notifications (id, user_id, title, message) VALUES ($1, $2, $3, $4)', 
      [id, userId, title, message]
    );
  } catch (error) {
    console.error('Failed to create notification: - server.ts:46', error);
  }
};

// Email Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Do not fail on invalid certs (common for some SMTP providers)
    rejectUnauthorized: false
  }
});

async function sendPasswordResetEmail(email: string, token: string, name: string, req?: express.Request) {
  let baseUrl = process.env.APP_URL;
  
  if (!baseUrl && req) {
    const protocol = req.protocol;
    const host = req.get('host');
    baseUrl = `${protocol}://${host}`;
  }
  
  if (!baseUrl || baseUrl.includes('localhost')) {
    if (req) {
      const forwardedHost = req.headers['x-forwarded-host'];
      const host = forwardedHost || req.get('host');
      if (host) baseUrl = `https://${host}`;
    }
  }

  const resetUrl = `${baseUrl || 'http://localhost:3000'}/reset-password?token=${token}`;
  
  console.log(`[DEBUG] Password Reset Link for ${email}: ${resetUrl} - server.ts:84`);
  
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"UniFound" <noreply@unifound.com>',
      to: email,
      subject: 'Reset your UniFound password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Password Reset Request</h2>
          <p>Hi ${name},</p>
          <p>We received a request to reset your password for your UniFound account. Click the button below to choose a new password:</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #64748b; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
          <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #2563eb; font-size: 14px; word-break: break-all;">${resetUrl}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="color: #94a3b8; font-size: 12px;">This link will expire in 1 hour.</p>
        </div>
      `,
    });
    console.log(`[EMAIL] Password reset email sent successfully to ${email} - server.ts:107`);
  } catch (error: any) {
    console.error('Failed to send password reset email: - server.ts:109', error);
  }
}

async function sendVerificationEmail(email: string, token: string, name: string, req?: express.Request) {
  let baseUrl = process.env.APP_URL;
  
  if (!baseUrl && req) {
    const protocol = req.protocol;
    const host = req.get('host');
    baseUrl = `${protocol}://${host}`;
  }
  
  if (!baseUrl || baseUrl.includes('localhost')) {
    // Fallback or override if we're in a specific environment
    // In AI Studio, we can often rely on the host header
    if (req) {
      const forwardedHost = req.headers['x-forwarded-host'];
      const host = forwardedHost || req.get('host');
      if (host) baseUrl = `https://${host}`;
    }
  }

  const verificationUrl = `${baseUrl || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  // ALWAYS log the link to the console as a fallback/debug measure
  console.log(`[DEBUG] Verification Link for ${email}: ${verificationUrl} - server.ts:135`);
  
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"UniFound" <noreply@unifound.com>',
      to: email,
      subject: 'Verify your UniFound account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Welcome to UniFound, ${name}!</h2>
          <p>Please click the button below to verify your email address and activate your account:</p>
          <div style="margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email Address</a>
          </div>
          <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #2563eb; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="color: #94a3b8; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `,
    });
    console.log(`[EMAIL] Verification email sent successfully to ${email} - server.ts:156`);
  } catch (error: any) {
    console.error('Failed to send verification email: - server.ts:158', error);
    if (error.code === 'EAUTH') {
      console.error('[EMAIL ERROR] Authentication failed. Please doublecheck your SMTP_USER and SMTP_PASS in the application settings. - server.ts:160');
    }
    // We don't throw here anymore to prevent the whole request from failing
    // The user will see the "check your email" message, and can check logs if it doesn't arrive
  }
}

// Initialize Database Schema
async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'STUDENT',
        is_verified BOOLEAN DEFAULT false,
        verification_token TEXT,
        avatar TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reset_token TEXT,
        reset_token_expiry TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        location TEXT,
        date TEXT,
        status TEXT DEFAULT 'OPEN',
        image_url TEXT,
        claimed_by TEXT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migrations are generally cleaner with explicit ADD COLUMN logic in PG, 
    // but the IF NOT EXISTS pattern or catching the error is fine for this prototype.
    const migrations = [
      { table: 'users', column: 'role', type: "TEXT DEFAULT 'STUDENT'" },
      { table: 'users', column: 'is_verified', type: 'BOOLEAN DEFAULT false' },
      { table: 'users', column: 'verification_token', type: 'TEXT' },
      { table: 'users', column: 'username', type: 'TEXT' },
      { table: 'reports', column: 'date', type: 'TEXT' },
      { table: 'reports', column: 'claimed_by', type: 'TEXT' },
      { table: 'reports', column: 'status', type: "TEXT DEFAULT 'PENDING'" }
    ];

    for (const m of migrations) {
      try {
        await client.query(`ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${m.type}`);
      } catch (e: any) {
        // PG error 42701 is duplicate_column
        if (e.code !== '42701') {
          console.error(`Migration error for ${m.column}: - server.ts:233`, e);
        }
      }
    }
  } finally {
    client.release();
  }
}

async function startServer() {
  console.log('[SERVER] Starting server initialization... - server.ts:243');
  const app = express();
  const PORT = 3000;

  initDb()
    .then(() => console.log('[SERVER] Postgres Database initialized successfully - server.ts:248'))
    .catch((e) => console.error('[SERVER] Failed to initialize database: - server.ts:249', e));

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - server.ts:256`);
    next();
  });

  // Middleware: Authenticate JWT
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Invalid token' });
      req.user = user;
      next();
    });
  };

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // --- AUTH ROUTES ---
  console.log('[SERVER] Setting up auth routes... - server.ts:279');

  app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password, username } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const id = Math.random().toString(36).substring(2, 15);
      const role = (email === 'abdulazeezadedayo@gmail.com' || email === 'i.love.owolabi@gmail.com') ? 'ADMIN' : 'STUDENT';
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      await pool.query(
        'INSERT INTO users (id, name, username, email, password, role, verification_token) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [id, name, username || email.split('@')[0], email, hashedPassword, role, verificationToken]
      );
      
      // Send email in background
      sendVerificationEmail(email, verificationToken, name, req).catch(err => {
        console.error('Background email error: - server.ts:296', err);
      });
      
      const token = jwt.sign({ id, email, name, role }, JWT_SECRET);
      res.json({ token, user: { id, name, email, role, isVerified: false } });
    } catch (error: any) {
      console.error('Signup error: - server.ts:302', error);
      // PG unique violation code is 23505
      if (error.code === '23505') {
        res.status(400).json({ error: 'Email already exists' });
      } else {
        res.status(500).json({ error: 'Server error: ' + error.message });
      }
    }
  });

  app.post('/api/auth/verify', async (req, res) => {
    const { token } = req.body;
    console.log(`[AUTH] Verification attempt with token: ${token?.substring(0, 8)}... - server.ts:314`);
    try {
      const { rows } = await pool.query('SELECT id, email FROM users WHERE verification_token = $1', [token]);
      const user = rows[0];
      
      if (!user) {
        console.log('[AUTH] Verification failed: Invalid token - server.ts:320');
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }

      console.log(`[AUTH] Verifying user: ${user.email} - server.ts:324`);
      await pool.query('UPDATE users SET is_verified = true, verification_token = NULL WHERE id = $1', [user.id]);
      console.log(`[AUTH] User ${user.email} verified successfully - server.ts:326`);
      res.json({ success: true });
    } catch (error) {
      console.error('[AUTH ERROR] Verification error: - server.ts:329', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/auth/resend-verification', authenticateToken, async (req: any, res) => {
    try {
      const { rows } = await pool.query('SELECT name, email, is_verified FROM users WHERE id = $1', [req.user.id]);
      const user = rows[0];
      
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (user.is_verified) return res.status(400).json({ error: 'Account already verified' });

      const verificationToken = crypto.randomBytes(32).toString('hex');
      await pool.query('UPDATE users SET verification_token = $1 WHERE id = $2', [verificationToken, req.user.id]);
      
      // We don't await this to prevent SMTP auth errors from blocking the response
      sendVerificationEmail(user.email, verificationToken, user.name, req).catch(err => {
        console.error('Resend email background error: - server.ts:347', err);
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Resend verification error: - server.ts:352', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = rows[0];
      
      if (!user) {
        // Obfuscate whether user exists to prevent email enumeration
        return res.json({ success: true, message: 'If exploring email is registered, you will receive a reset link.' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      // Token expires in 1 hour
      const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      
      await pool.query(
        'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3', 
        [resetToken, expiry, user.id]
      );
      
      sendPasswordResetEmail(email, resetToken, user.name, req).catch(console.error);
      
      res.json({ success: true, message: 'Password reset email sent.' });
    } catch (error) {
      console.error('Forgot password error: - server.ts:381', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
      const { rows } = await pool.query('SELECT id, reset_token_expiry FROM users WHERE reset_token = $1', [token]);
      const user = rows[0];
      
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }

      const expiryDate = new Date(user.reset_token_expiry);
      if (expiryDate < new Date()) {
        return res.status(400).json({ error: 'Token has expired' });
      }

      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      
      await pool.query(
        'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2', 
        [hashedPassword, user.id]
      );
      
      res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
      console.error('Reset password error: - server.ts:410', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`[AUTH] Login attempt for: ${email} - server.ts:417`);
    try {
      console.log(`[AUTH] Querying database for user: ${email} - server.ts:419`);
      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = rows[0];
      
      if (!user) {
        console.log(`[AUTH] Login failed: User not found (${email}) - server.ts:424`);
        return res.status(400).json({ error: 'User not found' });
      }

      console.log(`[AUTH] User found, comparing passwords... - server.ts:428`);
      const validPassword = bcrypt.compareSync(password, user.password);
      
      if (!validPassword) {
        console.log(`[AUTH] Login failed: Invalid password for ${email} - server.ts:432`);
        return res.status(400).json({ error: 'Invalid password' });
      }

      console.log(`[AUTH] Password valid, generating token... - server.ts:436`);
      const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET);
      
      console.log(`[AUTH] Login successful for: ${email} - server.ts:439`);
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          name: user.name, 
          username: user.username,
          email: user.email, 
          role: user.role, 
          isVerified: !!user.is_verified,
          avatar: user.avatar
        } 
      });
    } catch (error) {
      console.error('[AUTH ERROR] Login error: - server.ts:453', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    try {
      const { rows } = await pool.query('SELECT id, name, username, email, role, is_verified as "isVerified", avatar FROM users WHERE id = $1', [req.user.id]);
      const user = rows[0];
      
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({ user: { ...user, isVerified: !!user.isVerified } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.put('/api/auth/profile', authenticateToken, async (req: any, res) => {
    const { name, avatar } = req.body;
    try {
      await pool.query('UPDATE users SET name = $1, avatar = $2 WHERE id = $3', [name, avatar, req.user.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // --- REPORT ROUTES ---

  app.get('/api/reports', async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT r.*, u.name as "userName", u.avatar as "userAvatar" 
        FROM reports r 
        JOIN users u ON r.user_id = u.id 
        ORDER BY r.created_at DESC
      `);
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/reports/me', authenticateToken, async (req: any, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT r.*, u.name as "userName", u.avatar as "userAvatar" 
        FROM reports r 
        JOIN users u ON r.user_id = u.id 
        WHERE r.user_id = $1
        ORDER BY r.created_at DESC
      `, [req.user.id]);
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/reports', authenticateToken, async (req: any, res) => {
    const { type, title, description, category, location, date, dateOccurred, imageUrl, image_url } = req.body;
    const id = Math.random().toString(36).substring(2, 15);
    const reportDate = date || dateOccurred;
    const reportImage = imageUrl || image_url;
    
    try {
      await pool.query(`
        INSERT INTO reports (id, user_id, type, title, description, category, location, date, image_url, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING')
      `, [id, req.user.id, type, title, description, category, location, reportDate, reportImage]);
      
      // Notify all admins about the new report
      const { rows: admins } = await pool.query("SELECT id FROM users WHERE role = 'ADMIN'");
      for (const admin of admins) {
        await createNotification(
          admin.id,
          'New Report Pending',
          `A new ${type.toLowerCase()} report "${title}" has been submitted and requires approval.`
        );
      }

      // Notify the user who created the report
      await createNotification(
        req.user.id,
        'Report Submitted',
        `Your ${type.toLowerCase()} report "${title}" has been successfully submitted and is pending admin approval.`
      );

      res.json({ id });
    } catch (error) {
      console.error('Create report error: - server.ts:543', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/reports/:id', async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT r.*, u.name as "userName", u.avatar as "userAvatar" 
        FROM reports r 
        JOIN users u ON r.user_id = u.id 
        WHERE r.id = $1
      `, [req.params.id]);
      
      if (rows.length === 0) return res.status(404).json({ error: 'Report not found' });
      res.json(rows[0]);
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.put('/api/reports/:id/claim', authenticateToken, async (req: any, res) => {
    try {
      const { rows } = await pool.query('SELECT user_id, title FROM reports WHERE id = $1', [req.params.id]);
      const report = rows[0];
      
      if (!report) return res.status(404).json({ error: 'Report not found' });

      await pool.query(
        "UPDATE reports SET status = 'CLAIMED', claimed_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [req.user.id, req.params.id]
      );
      
      // Notify the owner
      await createNotification(
        report.user_id,
        'Item Claimed',
        `Someone has claimed your report: "${report.title}". Please check your dashboard for details.`
      );

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.delete('/api/reports/:id', authenticateToken, async (req: any, res) => {
    try {
      const { rows } = await pool.query('SELECT user_id FROM reports WHERE id = $1', [req.params.id]);
      const report = rows[0];
      
      if (!report) return res.status(404).json({ error: 'Report not found' });
      
      if (report.user_id !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      await pool.query('DELETE FROM reports WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
  });

  // --- ADMIN ROUTES ---

  app.get('/api/admin/stats', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Unauthorized' });

    try {
      const { rows: userRows } = await pool.query('SELECT COUNT(*) as count FROM users');
      const totalUsers = userRows[0];
      
      const { rows: reportRows } = await pool.query('SELECT COUNT(*) as count FROM reports');
      const totalReports = reportRows[0];
      
      const { rows: pendingRows } = await pool.query("SELECT COUNT(*) as count FROM reports WHERE status = 'PENDING'");
      const pendingReports = pendingRows[0];
      
      const { rows: resolvedRows } = await pool.query("SELECT COUNT(*) as count FROM reports WHERE status IN ('CLAIMED', 'RESOLVED')");
      const resolvedReports = resolvedRows[0];

      const { rows: categoryDistribution } = await pool.query(`
        SELECT category as name, COUNT(*) as value 
        FROM reports 
        GROUP BY category
      `);

      const { rows: weeklyActivityRaw } = await pool.query(`
        SELECT 
          CAST(created_at AS DATE) as day, 
          type, 
          COUNT(*) as count 
        FROM reports 
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY CAST(created_at AS DATE), type
      `);

      const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const weeklyActivity = last7Days.map(day => {
        // Handle timezone/date formatting differences gracefully
        const dayData = weeklyActivityRaw.filter((r: any) => {
           const d = new Date(r.day);
           return d.toISOString().split('T')[0] === day || r.day === day;
        });
        const lost = dayData.find((r: any) => r.type === 'LOST')?.count || 0;
        const found = dayData.find((r: any) => r.type === 'FOUND')?.count || 0;
        const dateObj = new Date(day);
        const name = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        return { name, lost: Number(lost), found: Number(found) };
      });

      res.json({
        totalUsers: Number(totalUsers.count),
        totalReports: Number(totalReports.count),
        pendingReports: Number(pendingReports.count),
        resolvedReports: Number(resolvedReports.count),
        weeklyActivity,
        categoryDistribution: categoryDistribution.map((c: any) => ({ ...c, value: Number(c.value) }))
      });
    } catch(e) {
       console.error("Stats Error: - server.ts:669", e);
       res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/admin/users', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Unauthorized' });
    try {
      const { rows } = await pool.query('SELECT id, name, email, role, is_verified as "isVerified", avatar FROM users');
      res.json(rows);
    } catch(e) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.put('/api/admin/users/:id/role', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Unauthorized' });
    const { role } = req.body;
    try {
      await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // --- NOTIFICATIONS ROUTES ---
  app.get('/api/notifications', authenticateToken, async (req: any, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT * FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 50
      `, [req.user.id]);
      res.json(rows);
    } catch (error) {
      console.error('Fetch notifications error: - server.ts:706', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/admin/reports/pending', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Unauthorized' });
    try {
      const { rows } = await pool.query("SELECT * FROM reports WHERE status = 'PENDING'");
      res.json(rows);
    } catch(e) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.put('/api/admin/reports/:id/status', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Unauthorized' });
    const { status } = req.body;
    
    try {
      const { rows } = await pool.query('SELECT user_id, title, type FROM reports WHERE id = $1', [req.params.id]);
      const report = rows[0];
      
      if (!report) return res.status(404).json({ error: 'Report not found' });

      // If status is 'APPROVED', we set it to the report's type (LOST or FOUND) 
      // so it shows up in the search results which filter by status
      if (status === 'APPROVED') {
        await pool.query('UPDATE reports SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [report.type, req.params.id]);
      } else {
        await pool.query('UPDATE reports SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, req.params.id]);
      }

      // Notify the user
      await createNotification(
        report.user_id,
        `Report ${status === 'REJECTED' ? 'Rejected' : 'Approved'}`,
        `Your report "${report.title}" has been ${status.toLowerCase()} by an admin.`
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Update status error: - server.ts:748', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // --- VITE MIDDLEWARE ---
  const distPath = path.join(process.cwd(), 'dist');

  if (process.env.NODE_ENV !== 'production') {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('[SERVER] Could not load vite, falling back to static production mode. - server.ts:765');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // To support Azure App Services which assign a port via process.env.PORT
  const serverPort = process.env.PORT || PORT;
  app.listen(serverPort, () => {
    console.log(`[SERVER] Server running on port ${serverPort} - server.ts:781`);
    console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'} - server.ts:782`);
  });
}

startServer();
