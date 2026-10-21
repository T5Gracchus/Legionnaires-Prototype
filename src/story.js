// Narrative boundary: D12/D24/D34/D37; design sync 2026-10-08.
// Off-world systems and the alien veteran belong to a later encounter.
export const OPENING_PREMISE = 'During the destruction of Varus’s army, a Roman century is cut off while recovering the wounded. Its centurion brings the survivors through the ambush, only to discover that their apparent deliverance has placed them in the hands of captors from beyond their world.';
export const CHARACTER_CONTEXT = {
  centurion: 'A veteran from Rome, entrusted by his childhood friend to watch over the man’s two sons. He mentors the brothers while commanding the detachment.',
  shield: 'One of two talented but relatively untested brothers from Rome. He excels with javelins and defensive fighting under the centurion’s guidance.',
  sword: 'The other brother from Rome, quick on his feet and skilled with the sword. He shares his brother’s talent and limited battle experience.',
  supporting: 'A legionnaire from the wider century, cut off with the rescue detachment. Recover the wounded and keep the withdrawal route open.',
};

export function missionDebrief(state) {
  if (!['captured', 'defeat'].includes(state.status)) return null;
  const total = state.casualties.length;
  const rescued = state.casualties.filter(c => c.state === 'rescued').length;
  const standing = state.units.filter(u => u.hp > 0).length;
  const captured = state.status === 'captured';
  return {
    label: captured ? 'ROMAN TUTORIAL COMPLETE / CAPTURED' : 'MISSION FAILED',
    title: captured ? 'Beyond the ambush.' : 'The line has fallen.',
    summary: `${rescued} / ${total} wounded evacuated · ${total - rescued} not evacuated · ${standing} / ${state.units.length} squad members standing`,
    text: captured
      ? 'The detachment reaches the rally ground, but its apparent deliverance ends in capture. The heroes will subsequently be sold to an alien in disguise and forced to fight wars beyond their world.'
      : 'No soldier remains standing to recover the squad. Try protecting the route with Defend while your carriers withdraw.',
  };
}
