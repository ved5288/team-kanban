/**
 * Message pools for checklist celebrations.
 * Messages are picked randomly to avoid staleness.
 */

/** Shown when a single checklist item is checked off. */
export const SINGLE_ITEM_MESSAGES = [
  'Nice one!',
  'One down!',
  'Keep going!',
  'Solid progress!',
  'Checked off!',
  'On a roll!',
  'Getting there!',
  'Boom!',
  'Crushing it!',
  'That felt good!',
  'Progress!',
  'Another one done!',
  'Moving forward!',
  'Tick!',
  'Nailed it!',
  'Keep the momentum!',
]

/** Shown when ALL items in a checklist are completed (100%). */
export const CHECKLIST_COMPLETE_MESSAGES = [
  'Checklist complete!',
  'You crushed it!',
  'All done — amazing!',
  'Every item checked!',
  'Mission accomplished!',
  '100% — well done!',
  'Clean sweep!',
  'Nothing left — great job!',
]

/** Pick a random message from an array. */
export function pickRandom(messages) {
  return messages[Math.floor(Math.random() * messages.length)]
}
