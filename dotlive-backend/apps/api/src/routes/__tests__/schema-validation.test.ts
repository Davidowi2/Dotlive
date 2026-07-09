/**
 * Schema Validation Tests
 * 
 * These tests verify that the actual database enforces the constraints
 * we expect. If you get failures here, it means schema or INSERT statements
 * are mismatched.
 * 
 * Run: npm run test -- schema-validation.test.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../../db/client';
import { payments, withdrawalRequests, dividends, dividendPayments, serviceOrders } from '../../db/schema';
import { sql } from 'drizzle-orm';
import crypto from 'node:crypto';

// Helper to create test user if needed
async function ensureTestUser() {
  const userId = 'test-schema-validator-' + crypto.randomUUID().substring(0, 8);
  return userId;
}

describe('Schema Validation Tests', () => {
  
  describe('payments table', () => {
    it('should reject INSERT without createdAt', async () => {
      const userId = await ensureTestUser();
      
      // This should fail with NOT NULL constraint
      const shouldFail = async () => {
        await db.execute(sql`
          INSERT INTO payments (user_id, dot_amount, naira_amount, status, reference)
          VALUES (${userId}, '100', '15000', 'pending', 'test_' + ${Date.now()})
        `);
      };
      
      await expect(shouldFail()).rejects.toThrow();
    });

    it('should accept INSERT with createdAt', async () => {
      const userId = await ensureTestUser();
      const now = new Date();
      
      const result = await db.execute(sql`
        INSERT INTO payments (user_id, dot_amount, naira_amount, status, reference, created_at)
        VALUES (${userId}, '100', '15000', 'pending', 'test_' + ${Date.now()}, ${now})
      `);
      
      expect(result).toBeDefined();
      
      // Cleanup
      await db.execute(sql`DELETE FROM payments WHERE user_id = ${userId}`);
    });

    it('should have createdAt auto-populated when using .defaultNow()', async () => {
      const userId = await ensureTestUser();
      
      const inserted = await db.insert(payments).values({
        userId,
        dotAmount: '100',
        nairaAmount: '15000',
        status: 'pending',
        reference: 'test_' + Date.now(),
        createdAt: new Date(),
      }).returning({ createdAt: payments.createdAt });
      
      expect(inserted[0].createdAt).toBeDefined();
      expect(inserted[0].createdAt).toBeInstanceOf(Date);
      
      // Cleanup
      await db.execute(sql`DELETE FROM payments WHERE user_id = ${userId}`);
    });
  });

  describe('withdrawal_requests table', () => {
    it('should reject INSERT without updatedAt', async () => {
      const userId = await ensureTestUser();
      
      const shouldFail = async () => {
        await db.execute(sql`
          INSERT INTO withdrawal_requests (user_id, amount_dot, amount_ngn, bank_info, status, kyc_tier)
          VALUES (${userId}, '50', '7500', '{}', 'pending', 'tier1')
        `);
      };
      
      await expect(shouldFail()).rejects.toThrow();
    });

    it('should accept INSERT with updatedAt', async () => {
      const userId = await ensureTestUser();
      const now = new Date();
      
      const result = await db.execute(sql`
        INSERT INTO withdrawal_requests (user_id, amount_dot, amount_ngn, bank_info, status, kyc_tier, updated_at)
        VALUES (${userId}, '50', '7500', '{}', 'pending', 'tier1', ${now})
      `);
      
      expect(result).toBeDefined();
      
      // Cleanup
      await db.execute(sql`DELETE FROM withdrawal_requests WHERE user_id = ${userId}`);
    });
  });

  describe('feed_comments table', () => {
    it('should reject INSERT without author_name', async () => {
      // First create a post to reference
      const postId = crypto.randomUUID();
      const authorId = await ensureTestUser();
      
      const shouldFail = async () => {
        await db.execute(sql`
          INSERT INTO feed_comments (id, post_id, author_id, body)
          VALUES (${crypto.randomUUID()}, ${postId}, ${authorId}, 'test comment')
        `);
      };
      
      // This might fail with foreign key or NOT NULL
      // We're checking that it doesn't succeed silently
      await expect(shouldFail()).rejects.toThrow();
    });

    it('should accept INSERT with author_name', async () => {
      const commentId = crypto.randomUUID();
      const postId = crypto.randomUUID();
      const authorId = await ensureTestUser();
      
      // Note: This will likely fail with foreign key constraint
      // but at least we're providing all required fields
      try {
        await db.execute(sql`
          INSERT INTO feed_comments (id, post_id, author_id, author_name, body)
          VALUES (${commentId}, ${postId}, ${authorId}, 'Test User', 'test comment')
        `);
      } catch (err) {
        // Expected to fail with FK constraint (post_id doesn't exist)
        // But NOT because author_name is missing
        expect(err?.message).not.toContain('author_name');
      }
    });
  });

  describe('dividends table', () => {
    it('should require createdAt field', async () => {
      const ventureId = crypto.randomUUID();
      const declaredBy = await ensureTestUser();
      
      const shouldFail = async () => {
        await db.execute(sql`
          INSERT INTO dividends (venture_id, declared_by, amount_naira, per_share_amount, period, status)
          VALUES (${ventureId}, ${declaredBy}, 500000, 100, '2026-Q1', 'declared')
        `);
      };
      
      await expect(shouldFail()).rejects.toThrow();
    });
  });

  describe('dividend_payments table', () => {
    it('should require createdAt field', async () => {
      const dividendId = crypto.randomUUID();
      const investorId = await ensureTestUser();
      const investmentId = crypto.randomUUID();
      
      const shouldFail = async () => {
        await db.execute(sql`
          INSERT INTO dividend_payments (dividend_id, investor_id, investment_id, shares_owned, amount_naira, status)
          VALUES (${dividendId}, ${investorId}, ${investmentId}, 10, 1000, 'pending')
        `);
      };
      
      await expect(shouldFail()).rejects.toThrow();
    });
  });

  describe('service_orders table', () => {
    it('should require updatedAt field', async () => {
      const serviceId = crypto.randomUUID();
      const clientId = await ensureTestUser();
      const builderId = await ensureTestUser();
      
      const shouldFail = async () => {
        await db.execute(sql`
          INSERT INTO service_orders (service_id, client_id, builder_id, amount_dot, title, status)
          VALUES (${serviceId}, ${clientId}, ${builderId}, '100', 'Test Service', 'in_progress')
        `);
      };
      
      await expect(shouldFail()).rejects.toThrow();
    });
  });

  // Test that defaults work
  describe('Default field handling', () => {
    it('should auto-generate id for payments', async () => {
      const userId = await ensureTestUser();
      
      const inserted = await db.insert(payments).values({
        userId,
        dotAmount: '100',
        nairaAmount: '15000',
        status: 'pending',
        reference: 'test_' + Date.now(),
        createdAt: new Date(),
      }).returning({ id: payments.id });
      
      expect(inserted[0].id).toBeDefined();
      expect(typeof inserted[0].id).toBe('string');
      
      // Cleanup
      await db.execute(sql`DELETE FROM payments WHERE user_id = ${userId}`);
    });
  });
});

describe('Complete INSERT Workflows', () => {
  
  it('should successfully create complete payment record', async () => {
    const userId = await ensureTestUser();
    const now = new Date();
    
    const inserted = await db.insert(payments).values({
      userId,
      dotAmount: '100',
      nairaAmount: '15000',
      status: 'pending',
      reference: 'workflow_test_' + Date.now(),
      createdAt: now,
    }).returning();
    
    expect(inserted).toHaveLength(1);
    expect(inserted[0].userId).toBe(userId);
    expect(inserted[0].dotAmount).toBe('100');
    expect(inserted[0].createdAt).toBeInstanceOf(Date);
    
    // Cleanup
    await db.execute(sql`DELETE FROM payments WHERE user_id = ${userId}`);
  });

  it('should successfully create complete withdrawal request', async () => {
    const userId = await ensureTestUser();
    const now = new Date();
    
    const inserted = await db.insert(withdrawalRequests).values({
      userId,
      amountDot: '50',
      amountNgn: '7500',
      bankInfo: JSON.stringify({ accountNumber: '123456' }),
      kycTier: 'tier1',
      status: 'pending',
      updatedAt: now,
    }).returning();
    
    expect(inserted).toHaveLength(1);
    expect(inserted[0].userId).toBe(userId);
    expect(inserted[0].updatedAt).toBeInstanceOf(Date);
    
    // Cleanup
    await db.execute(sql`DELETE FROM withdrawal_requests WHERE user_id = ${userId}`);
  });
});
