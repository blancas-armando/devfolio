/**
 * Comparison Groups Database Operations
 * Save and manage stock/ETF comparison groups
 */

import { getDb } from './index.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export type GroupType = 'stocks' | 'etfs' | 'mixed';

export interface ComparisonGroup {
  id: number;
  name: string;
  type: GroupType;
  members: string[];
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// Group Operations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new comparison group
 */
export function createGroup(
  name: string,
  symbols: string[],
  type: GroupType = 'stocks'
): ComparisonGroup {
  const db = getDb();
  const normalizedName = name.trim().toLowerCase();
  const normalizedSymbols = symbols.map(s => s.toUpperCase());

  const createGroupTx = db.transaction(() => {
    // Insert the group
    const result = db.prepare(
      'INSERT INTO comparison_groups (name, type) VALUES (?, ?)'
    ).run(normalizedName, type);

    const groupId = result.lastInsertRowid as number;

    // Insert members
    const insertMember = db.prepare(
      'INSERT INTO group_members (group_id, symbol) VALUES (?, ?)'
    );

    for (const symbol of normalizedSymbols) {
      insertMember.run(groupId, symbol);
    }

    return groupId;
  });

  const groupId = createGroupTx();

  return {
    id: groupId,
    name: normalizedName,
    type,
    members: normalizedSymbols,
    createdAt: new Date(),
  };
}

/**
 * Get a group by name
 */
export function getGroup(name: string): ComparisonGroup | null {
  const db = getDb();
  const normalizedName = name.trim().toLowerCase();

  const group = db.prepare(
    'SELECT id, name, type, created_at FROM comparison_groups WHERE name = ?'
  ).get(normalizedName) as { id: number; name: string; type: GroupType; created_at: string } | undefined;

  if (!group) return null;

  const members = db.prepare(
    'SELECT symbol FROM group_members WHERE group_id = ? ORDER BY added_at'
  ).all(group.id) as { symbol: string }[];

  return {
    id: group.id,
    name: group.name,
    type: group.type,
    members: members.map(m => m.symbol),
    createdAt: new Date(group.created_at),
  };
}

/**
 * Get all groups
 */
export function getAllGroups(): ComparisonGroup[] {
  const db = getDb();

  const groups = db.prepare(
    'SELECT id, name, type, created_at FROM comparison_groups ORDER BY created_at DESC'
  ).all() as { id: number; name: string; type: GroupType; created_at: string }[];

  return groups.map(g => {
    const members = db.prepare(
      'SELECT symbol FROM group_members WHERE group_id = ? ORDER BY added_at'
    ).all(g.id) as { symbol: string }[];

    return {
      id: g.id,
      name: g.name,
      type: g.type,
      members: members.map(m => m.symbol),
      createdAt: new Date(g.created_at),
    };
  });
}

/**
 * Update a group's members
 */
export function updateGroupMembers(name: string, symbols: string[]): ComparisonGroup | null {
  const db = getDb();
  const normalizedName = name.trim().toLowerCase();
  const normalizedSymbols = symbols.map(s => s.toUpperCase());

  const group = db.prepare(
    'SELECT id FROM comparison_groups WHERE name = ?'
  ).get(normalizedName) as { id: number } | undefined;

  if (!group) return null;

  const updateTx = db.transaction(() => {
    // Clear existing members
    db.prepare('DELETE FROM group_members WHERE group_id = ?').run(group.id);

    // Add new members
    const insertMember = db.prepare(
      'INSERT INTO group_members (group_id, symbol) VALUES (?, ?)'
    );

    for (const symbol of normalizedSymbols) {
      insertMember.run(group.id, symbol);
    }
  });

  updateTx();

  return getGroup(name);
}

/**
 * Add symbols to an existing group
 */
export function addToGroup(name: string, symbols: string[]): ComparisonGroup | null {
  const db = getDb();
  const normalizedName = name.trim().toLowerCase();
  const normalizedSymbols = symbols.map(s => s.toUpperCase());

  const group = db.prepare(
    'SELECT id FROM comparison_groups WHERE name = ?'
  ).get(normalizedName) as { id: number } | undefined;

  if (!group) return null;

  const insertMember = db.prepare(
    'INSERT OR IGNORE INTO group_members (group_id, symbol) VALUES (?, ?)'
  );

  for (const symbol of normalizedSymbols) {
    insertMember.run(group.id, symbol);
  }

  return getGroup(name);
}

/**
 * Remove symbols from a group
 */
export function removeFromGroup(name: string, symbols: string[]): ComparisonGroup | null {
  const db = getDb();
  const normalizedName = name.trim().toLowerCase();
  const normalizedSymbols = symbols.map(s => s.toUpperCase());

  const group = db.prepare(
    'SELECT id FROM comparison_groups WHERE name = ?'
  ).get(normalizedName) as { id: number } | undefined;

  if (!group) return null;

  const removeMember = db.prepare(
    'DELETE FROM group_members WHERE group_id = ? AND symbol = ?'
  );

  for (const symbol of normalizedSymbols) {
    removeMember.run(group.id, symbol);
  }

  return getGroup(name);
}

/**
 * Delete a group
 */
export function deleteGroup(name: string): boolean {
  const db = getDb();
  const normalizedName = name.trim().toLowerCase();

  const result = db.prepare(
    'DELETE FROM comparison_groups WHERE name = ?'
  ).run(normalizedName);

  return result.changes > 0;
}

/**
 * Rename a group
 */
export function renameGroup(oldName: string, newName: string): ComparisonGroup | null {
  const db = getDb();
  const normalizedOld = oldName.trim().toLowerCase();
  const normalizedNew = newName.trim().toLowerCase();

  const result = db.prepare(
    'UPDATE comparison_groups SET name = ? WHERE name = ?'
  ).run(normalizedNew, normalizedOld);

  if (result.changes === 0) return null;

  return getGroup(newName);
}

/**
 * Check if a group exists
 */
export function groupExists(name: string): boolean {
  const db = getDb();
  const normalizedName = name.trim().toLowerCase();

  const row = db.prepare(
    'SELECT 1 FROM comparison_groups WHERE name = ?'
  ).get(normalizedName);

  return !!row;
}

/**
 * Get group count
 */
export function getGroupCount(): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM comparison_groups').get() as { count: number };
  return row.count;
}
