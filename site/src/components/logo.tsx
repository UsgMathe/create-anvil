const ANVIL_PATH = [
  'M0 7',
  'L20 0',
  'L90 0',
  'L90 14',
  'L68 14',
  'L68 34',
  'L78 39',
  'L78 46',
  'L20 46',
  'L20 39',
  'L30 34',
  'L30 14',
  'L20 14',
  'Z',
].join(' ');

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 46" aria-hidden="true" className={className} fill="currentColor">
      <path d={ANVIL_PATH} />
    </svg>
  );
}
