/** Registry names are lowercase ASCII; anything with a pictograph in it is an emoji. */
export function isEmoji(name: string): boolean {
  return /\p{Extended_Pictographic}/u.test(name)
}
