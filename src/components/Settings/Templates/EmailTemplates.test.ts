import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { EmailTemplate } from '../../../types/templates.types';

describe('Vitest Configuration - Email Templates Test Suite', () => {
  
  describe('Basic Vitest Functionality', () => {
    it('should have expect globally available', () => {
      expect(true).toBe(true);
    });

    it('should support assertions', () => {
      const value = 42;
      expect(value).toBe(42);
      expect(value).toBeGreaterThan(40);
      expect(value).toBeLessThan(100);
    });

    it('should support string assertions', () => {
      const message = 'Hello World';
      expect(message).toContain('World');
      expect(message).toHaveLength(11);
      expect(message).toMatch(/World/);
    });

    it('should support array assertions', () => {
      const array = [1, 2, 3, 4, 5];
      expect(array).toHaveLength(5);
      expect(array).toContain(3);
      expect(array[0]).toBe(1);
    });

    it('should support object assertions', () => {
      const obj = { name: 'Test', value: 100 };
      expect(obj).toHaveProperty('name');
      expect(obj.name).toBe('Test');
      expect(obj).toEqual({ name: 'Test', value: 100 });
    });
  });

  describe('Mock Functions', () => {
    it('should create mock functions', () => {
      const mockFn = vi.fn();
      mockFn('test', 42);
      
      expect(mockFn).toHaveBeenCalled();
      expect(mockFn).toHaveBeenCalledWith('test', 42);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should track multiple calls', () => {
      const mockFn = vi.fn();
      mockFn('first');
      mockFn('second');
      mockFn('third');
      
      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(mockFn.mock.calls).toHaveLength(3);
      expect(mockFn.mock.calls[0][0]).toBe('first');
      expect(mockFn.mock.calls[1][0]).toBe('second');
      expect(mockFn.mock.calls[2][0]).toBe('third');
    });

    it('should mock return values', () => {
      const mockFn = vi.fn().mockReturnValue(42);
      const result = mockFn('test');
      
      expect(result).toBe(42);
      expect(mockFn).toHaveBeenCalled();
    });

    it('should implement mock functions', () => {
      const mockFn = vi.fn((a, b) => a + b);
      const result = mockFn(2, 3);
      
      expect(result).toBe(5);
    });
  });

  describe('Hooks and Setup', () => {
    let counter = 0;

    beforeEach(() => {
      counter = 0;
    });

    it('should reset state between tests', () => {
      expect(counter).toBe(0);
      counter = 10;
      expect(counter).toBe(10);
    });

    it('should start fresh in next test', () => {
      expect(counter).toBe(0);
    });
  });

  describe('Async Support', () => {
    it('should support async/await', async () => {
      const promise = Promise.resolve('success');
      const result = await promise;
      expect(result).toBe('success');
    });

    it('should support async assertions', async () => {
      const asyncFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'done';
      };

      const result = await asyncFn();
      expect(result).toBe('done');
    });
  });

  describe('Test Data - Email Template Mock', () => {
    const mockTemplate = {
      id: '1',
      name: 'Welcome Email',
      subject: 'Welcome to Our Service',
      body: '<p>Hello! Welcome to our service.</p>',
      use_case: 'Onboarding',
      createdBy: 'Admin',
      lastUpdatedAt: '2024-01-15 | 10:30 AM',
    };

    it('should have template structure', () => {
      expect(mockTemplate).toHaveProperty('id');
      expect(mockTemplate).toHaveProperty('name');
      expect(mockTemplate).toHaveProperty('subject');
      expect(mockTemplate).toHaveProperty('body');
      expect(mockTemplate).toHaveProperty('use_case');
      expect(mockTemplate).toHaveProperty('createdBy');
      expect(mockTemplate).toHaveProperty('lastUpdatedAt');
    });

    it('should have correct template values', () => {
      expect(mockTemplate.id).toBe('1');
      expect(mockTemplate.name).toBe('Welcome Email');
      expect(mockTemplate.use_case).toBe('Onboarding');
      expect(mockTemplate.body).toContain('Hello');
    });

    it('should support template modifications', () => {
      const updatedTemplate = { ...mockTemplate, name: 'Updated Template' };
      
      expect(updatedTemplate.name).toBe('Updated Template');
      expect(mockTemplate.name).toBe('Welcome Email');
    });
  });

  describe('Email Template Use Cases', () => {
    const useCases = [
      { name: 'Appointment', color: '#16A34A' },
      { name: 'Follow-up', color: '#3B82F6' },
      { name: 'Reminder', color: '#D97706' },
      { name: 'Re-engagement', color: '#7C3AED' },
      { name: 'Feedback', color: '#EA580C' },
    ];

    it('should support all use cases', () => {
      expect(useCases).toHaveLength(5);
      expect(useCases.map(u => u.name)).toContain('Appointment');
      expect(useCases.map(u => u.name)).toContain('Follow-up');
      expect(useCases.map(u => u.name)).toContain('Reminder');
    });

    it('should have valid colors for use cases', () => {
      useCases.forEach(useCase => {
        expect(useCase.color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    it('should find use case by name', () => {
      const found = useCases.find(u => u.name === 'Reminder');
      expect(found).toBeTruthy();
      expect(found?.color).toBe('#D97706');
    });
  });

  describe('Template Validation', () => {
    const validateTemplate = (template: EmailTemplate | null | undefined) => {
      return template &&
        typeof template.id === 'string' &&
        typeof template.audience_name === 'string' &&
        typeof template.subject === 'string' &&
        typeof template.email_body === 'string';
    };

    it('should validate valid template', () => {
      const validTemplate: EmailTemplate = {
        id: '1',
        audience_name: 'Test Audience',
        subject: 'Subject',
        email_body: '<p>Body</p>',
      };

      expect(validateTemplate(validTemplate)).toBe(true);
    });

    it('should reject invalid template', () => {
      const invalidTemplate: Partial<EmailTemplate> = {
        id: '1',
        audience_name: 'Test',
        // missing required fields
      };

      expect(validateTemplate(invalidTemplate as EmailTemplate)).toBe(false);
    });

    it('should handle edge case - empty strings', () => {
      const edgeCaseTemplate: EmailTemplate = {
        id: '',
        audience_name: '',
        subject: '',
        email_body: '',
      };

      expect(validateTemplate(edgeCaseTemplate)).toBe(true);
    });
  });

  describe('Template Sorting and Filtering', () => {
    const templates = [
      { id: '1', name: 'Template A', createdBy: 'Admin', use_case: 'Appointment' },
      { id: '2', name: 'Template B', createdBy: 'Manager', use_case: 'Reminder' },
      { id: '3', name: 'Template C', createdBy: 'Admin', use_case: 'Follow-up' },
      { id: '4', name: 'Template D', createdBy: 'Manager', use_case: 'Appointment' },
    ];

    it('should filter templates by use case', () => {
      const appointments = templates.filter(t => t.use_case === 'Appointment');
      expect(appointments).toHaveLength(2);
      expect(appointments[0].id).toBe('1');
      expect(appointments[1].id).toBe('4');
    });

    it('should filter templates by creator', () => {
      const adminTemplates = templates.filter(t => t.createdBy === 'Admin');
      expect(adminTemplates).toHaveLength(2);
      expect(adminTemplates.map(t => t.name)).toContain('Template A');
      expect(adminTemplates.map(t => t.name)).toContain('Template C');
    });

    it('should sort templates by name', () => {
      const sorted = [...templates].sort((a, b) => a.name.localeCompare(b.name));
      expect(sorted[0].name).toBe('Template A');
      expect(sorted[sorted.length - 1].name).toBe('Template D');
    });

    it('should paginate template list', () => {
      const pageSize = 2;
      const page = 0;
      const paginated = templates.slice(page * pageSize, page * pageSize + pageSize);
      
      expect(paginated).toHaveLength(2);
      expect(paginated[0].id).toBe('1');
      expect(paginated[1].id).toBe('2');
    });
  });
});
