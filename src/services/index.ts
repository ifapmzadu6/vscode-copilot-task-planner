/**
 * Service layer exports.
 * These services encapsulate the business logic for the Task Planner extension.
 */

export { WorkspaceAnalyzer } from './workspace-analyzer';
export { QuestionEngine, QuestionContext } from './question-engine';

// Plan services (modular, single-responsibility)
export {
    PlanGeneratorService,
    PlanTranslatorService,
    PlanReviserService,
    TaskRegistrationService,
} from './plan';

// Facade for backwards compatibility
/** @deprecated Use individual services from './plan' instead */
export { PlanGenerator } from './plan-generator';
