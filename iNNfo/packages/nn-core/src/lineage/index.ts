export {
  projectLineage,
  extractDeclaredCitations,
  extractFileCitations,
  evidenceCitationSites,
  type LineageDiagnostic,
  type LineageEdge,
  type LineageSource,
  type LineageKnowledge,
  type LineageArtifact,
  type LineageChangeset,
  type LineageProjection,
  type LineageView,
} from './project.js'

export {
  renderLineageSections,
  renderSourcesSection,
  renderModelsSection,
  renderArtifactsSection,
} from './render.js'

export {
  RECORD_BLUEPRINT,
  RECORD_TEMPLATE_URL,
  RECORD_INNFO_URL,
  splitFrontmatter,
  splitTopLevelSections,
  managedSections,
  renderRecordFrontmatter,
  refreshExistingModel,
  findLineageRecord,
  type RenderedSections,
  type TopLevelBlock,
  type ManagedSection,
} from './record.js'

export { checkLineageDrift, type LineageSectionDiff, type LineageDriftResult } from './drift.js'
