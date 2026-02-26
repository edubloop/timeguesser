const wholeNumberFormatter = new Intl.NumberFormat('de-DE', {
  maximumFractionDigits: 0,
});

export function formatWholeNumber(value: number): string {
  return wholeNumberFormatter.format(Math.round(value));
}
