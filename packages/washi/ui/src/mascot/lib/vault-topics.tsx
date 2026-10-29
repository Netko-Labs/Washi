import type { VaultTopic } from './types'

/**
 * Vault topic definitions from the Washi Vault Icons handoff: one background
 * hue, backdrop doodles, a face, and a prop per topic. Body stays fixed.
 */

const INK = '#6B3A1F'

export const SPARKLE_EYES = (
  <>
    <circle cx="372" cy="672" r="54" fill="#2A1B12" />
    <circle cx="652" cy="672" r="54" fill="#2A1B12" />
    <circle cx="390" cy="654" r="19" fill="#fff" />
    <circle cx="356" cy="688" r="9" fill="#fff" />
    <circle cx="670" cy="654" r="19" fill="#fff" />
    <circle cx="636" cy="688" r="9" fill="#fff" />
  </>
)

export const OPEN_SMILE = (
  <>
    <path d="M458 742 Q512 730 566 742 Q556 812 512 816 Q468 812 458 742 Z" fill="#7A3A22" />
    <ellipse cx="512" cy="798" rx="34" ry="18" fill="#E8836B" />
  </>
)

// biome-ignore format: geometry tables read better dense
export const VAULT_TOPICS: Record<string, VaultTopic> = {
  journal: {
    bg: '#DF8552',
    backdrop: <g opacity="0.75"><path d="M110 210 Q150 160 190 210 Q230 260 270 210 Q310 160 350 210" fill="none" stroke="#FFF6E4" strokeWidth="13" strokeLinecap="round" /><path d="M800 140 Q809 171 840 180 Q809 189 800 220 Q791 189 760 180 Q791 171 800 140 Z" fill="#F7DC8A" /><circle cx="700" cy="130" r="9" fill="#FFF6E4" /><circle cx="880" cy="270" r="7" fill="#FFF6E4" /></g>,
    face: <>{SPARKLE_EYES}{OPEN_SMILE}</>,
    extra: <g transform="translate(668,1000) rotate(-32)"><rect x="-18" y="-160" width="36" height="160" rx="8" fill="#E8A23F" stroke={INK} strokeWidth="12" /><path d="M-18 -160 L0 -204 L18 -160 Z" fill="#F4DDB8" stroke={INK} strokeWidth="12" strokeLinejoin="round" /></g>,
  },
  work: {
    bg: '#A08D77',
    backdrop: <g opacity="0.8"><rect x="150" y="150" width="84" height="84" rx="18" fill="none" stroke="#FFF6E4" strokeWidth="12" /><path d="M172 194 L192 214 L216 168" fill="none" stroke="#F7DC8A" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" /><path d="M780 190 L806 216 L862 150" fill="none" stroke="#FFF6E4" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" /></g>,
    face: <><circle cx="372" cy="672" r="40" fill="#2A1B12" /><circle cx="652" cy="672" r="40" fill="#2A1B12" /><circle cx="384" cy="660" r="12" fill="#fff" /><circle cx="664" cy="660" r="12" fill="#fff" /><circle cx="372" cy="672" r="76" fill="none" stroke="#3A2A1E" strokeWidth="16" /><circle cx="652" cy="672" r="76" fill="none" stroke="#3A2A1E" strokeWidth="16" /><path d="M448 664 Q512 640 576 664" fill="none" stroke="#3A2A1E" strokeWidth="16" /><path d="M462 782 Q512 806 562 782" fill="none" stroke="#7A3A22" strokeWidth="22" strokeLinecap="round" /></>,
    extra: <path d="M512 862 L558 912 L512 998 L466 912 Z" fill="#8A4A36" stroke={INK} strokeWidth="12" strokeLinejoin="round" />,
  },
  ideas: {
    bg: '#E2BC6F',
    ear: '#D2A360',
    backdrop: <g opacity="0.85"><path d="M760 124 Q768 152 796 160 Q768 168 760 196 Q752 168 724 160 Q752 152 760 124 Z" fill="#FFF6E4" /><path d="M860 236 Q866 254 884 260 Q866 266 860 284 Q854 266 836 260 Q854 254 860 236 Z" fill="#F7DC8A" /><circle cx="900" cy="120" r="8" fill="#FFF6E4" /></g>,
    face: <><path d="M372 610 Q384 660 434 672 Q384 684 372 734 Q360 684 310 672 Q360 660 372 610 Z" fill="#2A1B12" /><path d="M652 610 Q664 660 714 672 Q664 684 652 734 Q640 684 590 672 Q640 660 652 610 Z" fill="#2A1B12" />{OPEN_SMILE}</>,
    extra: <><circle cx="236" cy="286" r="64" fill="#F7DC8A" stroke={INK} strokeWidth="14" /><rect x="212" y="344" width="48" height="36" rx="10" fill="#A08D77" stroke={INK} strokeWidth="12" /><path d="M236 176 V140 M330 220 L356 194 M142 220 L116 194" stroke={INK} strokeWidth="14" strokeLinecap="round" /></>,
  },
  study: {
    bg: '#ABB894',
    ear: '#8A9A74',
    backdrop: <g opacity="0.75" stroke="#FFF6E4" strokeLinecap="round" fill="none"><path d="M220 150 V190 M200 170 H240" strokeWidth="14" /><path d="M790 128 V156 M776 142 H804" strokeWidth="12" /><circle cx="860" cy="240" r="18" strokeWidth="10" /></g>,
    face: <>{SPARKLE_EYES}<path d="M460 764 Q512 806 564 764" fill="none" stroke="#7A3A22" strokeWidth="22" strokeLinecap="round" /></>,
    extra: <><path d="M512 330 L716 404 L512 478 L308 404 Z" fill="#4A3A2E" stroke="#2A1B12" strokeWidth="12" strokeLinejoin="round" /><path d="M716 404 L738 520" stroke="#E2BC6F" strokeWidth="12" strokeLinecap="round" /><circle cx="738" cy="534" r="18" fill="#E2BC6F" stroke={INK} strokeWidth="10" /></>,
  },
  recipes: {
    bg: '#D9908A',
    backdrop: <g opacity="0.7"><path d="M430 230 Q410 190 430 150 Q450 110 430 70" fill="none" stroke="#FFF6E4" strokeWidth="14" strokeLinecap="round" /><path d="M594 230 Q574 190 594 150 Q614 110 594 70" fill="none" stroke="#FFF6E4" strokeWidth="14" strokeLinecap="round" /><path d="M760 168 C736 148 742 118 760 122 C778 118 784 148 760 168 Z" fill="#F6C9C0" /></g>,
    face: <>{SPARKLE_EYES}<path d="M458 742 Q512 730 566 742 Q556 812 512 816 Q468 812 458 742 Z" fill="#7A3A22" /><ellipse cx="524" cy="806" rx="30" ry="22" fill="#E8836B" /></>,
    extra: <><circle cx="420" cy="356" r="66" fill="#FDF8EC" stroke={INK} strokeWidth="14" /><circle cx="604" cy="356" r="66" fill="#FDF8EC" stroke={INK} strokeWidth="14" /><circle cx="512" cy="322" r="80" fill="#FDF8EC" stroke={INK} strokeWidth="14" /><rect x="408" y="376" width="208" height="86" rx="20" fill="#FDF8EC" stroke={INK} strokeWidth="14" /></>,
  },
  travel: {
    bg: '#9FB4B8',
    backdrop: <g opacity="0.9"><circle cx="830" cy="150" r="56" fill="#F2D488" /><ellipse cx="200" cy="200" rx="70" ry="30" fill="#FFF6E4" /><circle cx="170" cy="180" r="28" fill="#FFF6E4" /><circle cx="230" cy="178" r="30" fill="#FFF6E4" /></g>,
    face: <><circle cx="372" cy="672" r="54" fill="#2A1B12" /><circle cx="390" cy="654" r="19" fill="#fff" /><circle cx="356" cy="688" r="9" fill="#fff" /><path d="M600 678 Q652 636 704 678" fill="none" stroke="#2A1B12" strokeWidth="24" strokeLinecap="round" />{OPEN_SMILE}</>,
    extra: <><path d="M352 434 Q352 316 512 316 Q672 316 672 434 Z" fill="#E4C67E" stroke={INK} strokeWidth="14" /><rect x="352" y="400" width="320" height="36" fill="#C97B5A" stroke={INK} strokeWidth="12" /><ellipse cx="512" cy="440" rx="256" ry="44" fill="#E4C67E" stroke={INK} strokeWidth="14" /></>,
  },
  finance: {
    bg: '#C0A45E',
    ear: '#D2A360',
    backdrop: <g opacity="0.85"><circle cx="190" cy="170" r="44" fill="#EED27A" stroke="#8A6A2E" strokeWidth="10" /><circle cx="190" cy="170" r="26" fill="none" stroke="#C9A84C" strokeWidth="8" /><circle cx="840" cy="240" r="34" fill="#EED27A" stroke="#8A6A2E" strokeWidth="10" /><circle cx="840" cy="240" r="20" fill="none" stroke="#C9A84C" strokeWidth="8" /><path d="M760 92 Q766 114 788 120 Q766 126 760 148 Q754 126 732 120 Q754 114 760 92 Z" fill="#FFF6E4" /></g>,
    face: <><circle cx="372" cy="672" r="40" fill="#2A1B12" /><circle cx="652" cy="672" r="40" fill="#2A1B12" /><circle cx="386" cy="658" r="13" fill="#fff" /><circle cx="666" cy="658" r="13" fill="#fff" /><circle cx="512" cy="782" r="36" fill="#7A3A22" /></>,
    extra: <><circle cx="356" cy="946" r="80" fill="#EED27A" stroke="#8A6A2E" strokeWidth="14" /><circle cx="356" cy="946" r="52" fill="none" stroke="#C9A84C" strokeWidth="10" /></>,
  },
  music: {
    bg: '#B08A96',
    backdrop: <g opacity="0.8" fill="#FFF6E4" stroke="#FFF6E4"><ellipse cx="200" cy="244" rx="24" ry="17" transform="rotate(-20 200 244)" stroke="none" /><path d="M222 238 V130" strokeWidth="12" strokeLinecap="round" fill="none" /><path d="M222 130 Q262 150 250 190" strokeWidth="12" strokeLinecap="round" fill="none" /><ellipse cx="820" cy="194" rx="18" ry="13" transform="rotate(-20 820 194)" stroke="none" /><path d="M834 190 V110" strokeWidth="10" strokeLinecap="round" fill="none" /><path d="M834 110 Q864 126 856 156" strokeWidth="10" strokeLinecap="round" fill="none" /></g>,
    face: <><path d="M320 678 Q372 636 424 678" fill="none" stroke="#2A1B12" strokeWidth="24" strokeLinecap="round" /><path d="M600 678 Q652 636 704 678" fill="none" stroke="#2A1B12" strokeWidth="24" strokeLinecap="round" /><circle cx="512" cy="786" r="26" fill="#7A3A22" /></>,
    extra: <><path d="M270 600 Q270 372 512 372 Q754 372 754 600" fill="none" stroke="#3A2A26" strokeWidth="30" /><rect x="216" y="560" width="92" height="150" rx="42" fill="#4A3428" stroke="#2A1B12" strokeWidth="12" /><rect x="716" y="560" width="92" height="150" rx="42" fill="#4A3428" stroke="#2A1B12" strokeWidth="12" /></>,
  },
  anime: {
    bg: '#C96F5B',
    ear: '#D2A360',
    backdrop: <><g opacity="0.55" stroke="#FFF6E4" strokeWidth="12" strokeLinecap="round"><path d="M60 60 L200 170" /><path d="M130 40 L240 140" /><path d="M920 70 L800 170" /></g><g><circle cx="840" cy="253" r="17" fill="#F6C9C0" /><circle cx="870" cy="275" r="17" fill="#F6C9C0" /><circle cx="858" cy="310" r="17" fill="#F6C9C0" /><circle cx="822" cy="310" r="17" fill="#F6C9C0" /><circle cx="810" cy="275" r="17" fill="#F6C9C0" /><circle cx="840" cy="285" r="11" fill="#F7DC8A" /></g></>,
    face: <>{SPARKLE_EYES}<path d="M300 770 Q306 794 330 800 Q306 806 300 830 Q294 806 270 800 Q294 794 300 770 Z" fill="#F7DC8A" />{OPEN_SMILE}</>,
    extra: <><rect x="164" y="516" width="696" height="52" rx="26" fill="#C94F3F" stroke={INK} strokeWidth="14" /><path d="M852 552 L940 512 M852 560 L928 600" stroke="#C94F3F" strokeWidth="26" strokeLinecap="round" /></>,
  },
  gaming: {
    bg: '#8FA89A',
    backdrop: <g><rect x="170" y="150" width="46" height="46" rx="8" fill="#FFF6E4" opacity="0.7" /><rect x="240" y="220" width="30" height="30" rx="6" fill="#E8A23F" opacity="0.8" /><rect x="800" y="140" width="40" height="40" rx="8" fill="#C94F3F" opacity="0.7" /><rect x="858" y="220" width="26" height="26" rx="6" fill="#FFF6E4" opacity="0.6" /></g>,
    face: <>{SPARKLE_EYES}<path d="M460 760 Q512 798 564 760" fill="none" stroke="#7A3A22" strokeWidth="22" strokeLinecap="round" /></>,
    extra: <><rect x="368" y="912" width="288" height="150" rx="66" fill="#5A4A3C" stroke="#2A1B12" strokeWidth="14" /><path d="M448 962 V1012 M423 987 H473" stroke="#EFE7DA" strokeWidth="20" strokeLinecap="round" /><circle cx="576" cy="968" r="17" fill="#E8A23F" /><circle cx="604" cy="1006" r="17" fill="#C94F3F" /></>,
  },
  reading: {
    bg: '#BFA37E',
    backdrop: <><g transform="translate(190,190) rotate(-18)" opacity="0.85"><rect x="-45" y="-55" width="90" height="110" rx="10" fill="#FDF8EC" /><path d="M-24 -20 H24 M-24 8 H24" stroke="#BFA37E" strokeWidth="8" strokeLinecap="round" /></g><g transform="translate(830,180) rotate(14) scale(0.7)" opacity="0.8"><rect x="-45" y="-55" width="90" height="110" rx="10" fill="#FDF8EC" /><path d="M-24 -20 H24 M-24 8 H24" stroke="#BFA37E" strokeWidth="8" strokeLinecap="round" /></g></>,
    face: <><path d="M320 678 Q372 636 424 678" fill="none" stroke="#2A1B12" strokeWidth="24" strokeLinecap="round" /><path d="M600 678 Q652 636 704 678" fill="none" stroke="#2A1B12" strokeWidth="24" strokeLinecap="round" /><path d="M470 768 Q512 794 554 768" fill="none" stroke="#7A3A22" strokeWidth="20" strokeLinecap="round" /></>,
    extra: <><path d="M352 938 Q432 902 512 938 Q592 902 672 938 L672 1070 Q592 1034 512 1070 Q432 1034 352 1070 Z" fill="#FDF8EC" stroke={INK} strokeWidth="16" strokeLinejoin="round" /><path d="M512 938 V1070" stroke={INK} strokeWidth="12" /></>,
  },
  plants: {
    bg: '#93A582',
    ear: '#8A9A74',
    backdrop: <g><ellipse cx="190" cy="160" rx="34" ry="16" transform="rotate(-30 190 160)" fill="#7FA06A" opacity="0.8" /><ellipse cx="260" cy="260" rx="24" ry="12" transform="rotate(20 260 260)" fill="#C9DAB4" opacity="0.8" /><ellipse cx="800" cy="150" rx="30" ry="14" transform="rotate(25 800 150)" fill="#7FA06A" opacity="0.7" /><ellipse cx="860" cy="260" rx="20" ry="10" transform="rotate(-15 860 260)" fill="#C9DAB4" opacity="0.7" /></g>,
    face: <>{SPARKLE_EYES}{OPEN_SMILE}</>,
    extra: <><path d="M512 452 Q506 400 512 366" fill="none" stroke="#4A6A3A" strokeWidth="18" strokeLinecap="round" /><ellipse cx="462" cy="352" rx="50" ry="27" fill="#7FA06A" stroke="#4A6A3A" strokeWidth="12" transform="rotate(-32 462 352)" /><ellipse cx="562" cy="352" rx="50" ry="27" fill="#7FA06A" stroke="#4A6A3A" strokeWidth="12" transform="rotate(32 562 352)" /></>,
  },
}

/** Handoff display order — pickers offer every character in the set. */
export const VAULT_TOPIC_ORDER = [
  'journal',
  'work',
  'ideas',
  'study',
  'recipes',
  'travel',
  'finance',
  'music',
  'anime',
  'gaming',
  'reading',
  'plants',
] as const
