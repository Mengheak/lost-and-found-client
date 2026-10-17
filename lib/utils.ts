export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export const getFirstChar = (value: string) => {
  return value[0];
};
