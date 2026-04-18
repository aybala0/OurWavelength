export const AVATARS = [
  'cat', 'corgi', 'panda', 'bear', 'bunny', 'fox',
  'lion', 'tiger', 'hippo', 'elephant', 'penguin', 'owl',
  'monkey', 'giraffe', 'zebra', 'sheep', 'cow',
  'koala', 'kangaroo', 'chicken', 'duck', 'pig', 'squirrel',
] as const

export type AvatarId = typeof AVATARS[number]

export function avatarSrc(id: string) {
  return `/avatars/${id}.png`
}
