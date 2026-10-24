import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// One isolated simulation per secure random demo session. Effects live in the
// versioned state row so approval + both mock effects commit atomically.
export const campusStates = sqliteTable('campus_states', {
  id: text('id').primaryKey(),
  revision: integer('revision').notNull().default(0),
  body: text('body').notNull(),
  updatedAt: text('updated_at').notNull(),
});
export const demoSessions = sqliteTable('demo_sessions', {
  id: text('id').primaryKey(),
  stateId: text('state_id').notNull().references(() => campusStates.id),
  role: text('role', { enum: ['organizer', 'facilities', 'attendee'] }).notNull().default('organizer'),
  expiresAt: text('expires_at').notNull(),
});
