import * as display from '../../ui/display.js';

/** @typedef {import('../../types.js').CliArgs} CliArgs */
/** @typedef {import('../../types.js').DeliveryMode} DeliveryMode */
/** @typedef {import('../../types.js').Language} Language */
/** @typedef {import('../../types.js').P5Mode} P5Mode */
/** @typedef {import('../../types.js').SetupType} SetupType */
/** @typedef {import('../../types.js').Selections} Selections */


/**
 *
 * @param {string|null} typeDefsVersion
 * @param {CliArgs} args
 * @param {string} projectName
 * @param {Selections} selections
 */
export function stepPrintProjectSummary(projectName, typeDefsVersion, selections, args) {
  const summaryLines = [
    'note.projectSummary.name'
  ];
  if (selections.selectedLanguage) {
    summaryLines.push('note.projectSummary.language', 'note.projectSummary.p5Mode');
  }
  summaryLines.push(
    'note.projectSummary.version',
    'note.projectSummary.mode'
  );
  if (typeDefsVersion) {
    summaryLines.push('note.projectSummary.types');
  }
  if (args.git) {
    summaryLines.push('note.projectSummary.git');
  }
  display.note(summaryLines, 'note.projectSummary.title', {
    name: projectName,
    language: selections.selectedLanguage,
    p5Mode: selections.selectedP5Mode,
    version: selections.selectedVersion,
    mode: selections.selectedDeliveryMode,
    types: typeDefsVersion
  });

  // Next steps and documentation
  const nextStepsLines = [
    'note.nextSteps.step1',
    'note.nextSteps.step2',
    'note.nextSteps.documentation',
    'note.nextSteps.reference',
    'note.nextSteps.examples',
    'note.nextSteps.update'
  ];
  display.note(nextStepsLines, 'note.nextSteps.title', { projectName });

  // Language and mode-specific tips
  if (selections.selectedLanguage === 'typescript') {
    const tipsLines = [
      'note.typescriptTips.editor',
      'note.typescriptTips.install',
      'note.typescriptTips.compile'
    ];
    display.note(tipsLines, 'note.typescriptTips.title');
  }

  if (selections.selectedP5Mode === 'instance') {
    const tipsLines = [
      'note.instanceTips.multiple',
      'note.instanceTips.usage'
    ];
    display.note(tipsLines, 'note.instanceTips.title');
  }

  if (args.git) {
    const gitTipsLines = ['note.gitTips.firstCommit'];
    if (selections.selectedDeliveryMode === 'local') {
      gitTipsLines.push('note.gitTips.libIgnored');
    }
    display.note(gitTipsLines, 'note.gitTips.title');
  }
}
