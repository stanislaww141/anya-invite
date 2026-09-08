import { CUTS, FILM_LENGTH, INVITE_REVEAL } from './cinematic-director';

export const STORY_DURATION = FILM_LENGTH;
export const INVITATION_AT = INVITE_REVEAL;
export function storyBeat(seconds: number): number {
  if (seconds >= INVITATION_AT) return 6;
  if (seconds >= 39) return 5;
  if (seconds >= CUTS[2] + .8) return 4;
  if (seconds >= CUTS[1] + .8) return 3;
  if (seconds >= CUTS[0] + .8) return 2;
  if (seconds >= 2.2) return 1;
  return 0;
}
