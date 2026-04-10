export interface Spectrum {
  id: string
  left: string
  right: string
}

export const SPECTRUMS: Spectrum[] = [
  { id: '1',  left: 'Cold',      right: 'Hot' },
  { id: '2',  left: 'Slow',      right: 'Fast' },
  { id: '3',  left: 'Ugly',      right: 'Beautiful' },
  { id: '4',  left: 'Quiet',     right: 'Loud' },
  { id: '5',  left: 'Simple',    right: 'Complex' },
  { id: '6',  left: 'Old',       right: 'New' },
  { id: '7',  left: 'Dark',      right: 'Light' },
  { id: '8',  left: 'Weak',      right: 'Strong' },
  { id: '9',  left: 'Sad',       right: 'Happy' },
  { id: '10', left: 'Boring',    right: 'Exciting' },
  { id: '11', left: 'Natural',   right: 'Artificial' },
  { id: '12', left: 'Cheap',     right: 'Expensive' },
  { id: '13', left: 'Rare',      right: 'Common' },
  { id: '14', left: 'Safe',      right: 'Dangerous' },
  { id: '15', left: 'Serious',   right: 'Funny' },
  { id: '16', left: 'Soft',      right: 'Hard' },
  { id: '17', left: 'Small',     right: 'Large' },
  { id: '18', left: 'Passive',   right: 'Aggressive' },
  { id: '19', left: 'Private',   right: 'Public' },
  { id: '20', left: 'Abstract',  right: 'Concrete' },
  { id: '21', left: 'Healthy',   right: 'Unhealthy' },
  { id: '22', left: 'Romantic',  right: 'Unromantic' },
  { id: '23', left: 'Overrated', right: 'Underrated' },
  { id: '24', left: 'Trustworthy', right: 'Sketchy' },
  { id: '25', left: 'Lowbrow',   right: 'Highbrow' },
]

export function getSpectrum(id: string): Spectrum | undefined {
  return SPECTRUMS.find(s => s.id === id)
}
