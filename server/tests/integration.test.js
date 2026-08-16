import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { simplifyDebts } from '../src/services/debtSimplifier.js';

describe('SettleUp Integration and Unit Tests', () => {
  let connectSpy;
  let findOneSpy;
  let createSpy;

  beforeEach(() => {
    connectSpy = jest.spyOn(mongoose, 'connect').mockResolvedValue(true);
    findOneSpy = jest.spyOn(User, 'findOne').mockImplementation(() => ({
      exec: jest.fn().mockResolvedValue(null)
    }));
    createSpy = jest.spyOn(User, 'create').mockImplementation((data) => {
      const userObj = {
        _id: 'user123',
        name: data.name,
        email: data.email,
      };
      return Promise.resolve({
        ...userObj,
        toObject: () => userObj,
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Auth Integration', () => {
    test('POST /api/auth/signup creates a user', async () => {
      findOneSpy.mockImplementation(() => Promise.resolve(null));

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.user.name).toBe('Test User');
    });
  });

  describe('Debt Solver Logic', () => {
    test('resolves simple transaction', () => {
      const balances = [
        { userId: 'A', net: 50 },
        { userId: 'B', net: -50 },
      ];
      const txs = simplifyDebts(balances);
      expect(txs.length).toBe(1);
      expect(txs[0].from).toBe('B');
      expect(txs[0].to).toBe('A');
      expect(txs[0].amount).toBe(50);
    });

    test('ignores zero balances', () => {
      const balances = [
        { userId: 'A', net: 0 },
        { userId: 'B', net: 0 },
      ];
      const txs = simplifyDebts(balances);
      expect(txs.length).toBe(0);
    });
  });
});
