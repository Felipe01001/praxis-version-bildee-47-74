
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { ptBR };
