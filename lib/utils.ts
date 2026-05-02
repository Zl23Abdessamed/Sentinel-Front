import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// shadcn-style classname helper. Use everywhere instead of template-string
// concatenation so duplicate Tailwind utilities collapse correctly.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
