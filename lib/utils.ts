import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getHeroFrame = (quality: string) => {
  switch (quality) {
    case '名将': return 'https://cdn.jsdelivr.net/gh/dreamforgame-win/slg-assets@main/UI/tex_frm_cheng.png';
    case '良将': return 'https://cdn.jsdelivr.net/gh/dreamforgame-win/slg-assets@main/UI/tex_frm_zi.png';
    case '裨将': return 'https://cdn.jsdelivr.net/gh/dreamforgame-win/slg-assets@main/UI/tex_frm_lan.png';
    default: return 'https://cdn.jsdelivr.net/gh/dreamforgame-win/slg-assets@main/UI/tex_frm_lan.png';
  }
}
