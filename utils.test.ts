import { describe, it, expect, vi } from 'vitest';
import { getSlaStatus } from './utils';
import { SuriContact } from './types';

describe('getSlaStatus', () => {
  it('should return percentage greater than 100 when overdue', () => {
    const contact: SuriContact = {
      lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      id: '',
      source: '',
      status: '',
      channel: '',
      lastMessage: '',
      unread: false,
      isPrivate: false,
      isPinned: false,
      agent: null,
      customer: {
        id: '',
        name: '',
        email: '',
        phone: ''
      },
      departmentId: '',
      defaultDepartmentId: ''
    };
    const slaLimit = 15; // 15 minutes
    const result = getSlaStatus(contact, slaLimit);
    expect(result.percentage).toBeGreaterThan(100);
  });
});
