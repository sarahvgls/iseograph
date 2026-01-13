/**
 * Search Module
 * Exports KMP-based string search functionality for DAG structures
 */

// Types
export {
  type NodeSearchField,
  type MatchResult,
  type NodeMatch,
  type PathMatch,
  type SearchResults,
  type SearchOptions,
} from "./types";

// Core KMP algorithm
export {
  buildFailureFunction,
  kmpSearch,
  kmpSearchWithContext,
  kmpContains,
} from "./kmp-algorithm";

// DAG-specific search functionality
export { DAGSearchIndex, createSearchIndex } from "./dag-search";
