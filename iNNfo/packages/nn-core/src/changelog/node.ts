/**
 * Node-backed change log reader. Node-only: NOT exported from `browser.ts`.
 */
import { readLineageSnapshot } from '../lineage/fs-snapshot.js'
import { buildChangeLog, type ChangeLog } from './load.js'

/** Reads the workspace snapshot and builds its change log. */
export function loadChangeLog(rootDir: string): ChangeLog {
  return buildChangeLog(readLineageSnapshot(rootDir))
}
