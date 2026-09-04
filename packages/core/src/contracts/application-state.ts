/**
 * The 7 possible states of an `Application` throughout its life. The state
 * machine that transitions between them is implemented in Phase 2 — this type
 * only lists the valid states.
 */
export type ApplicationState =
  | "created"      
  | "registering"  
  | "booting"      
  | "ready"        
  | "draining"     
  | "terminated"   
  | "errored";     