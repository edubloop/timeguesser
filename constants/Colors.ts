const Colors = {
  light: {
    background: '#FFFFFF',
    backgroundSecondary: '#F5F5F7',
    backgroundTertiary: '#EBEBED',
    overlay: 'rgba(0,0,0,0.5)',

    text: '#1A1A1C',
    secondaryText: '#6B6B70',
    tertiaryText: '#98989D',
    inverseText: '#FFFFFF',

    tint: '#1A8A7D',
    tintPressed: '#15756A',
    tintSubtle: '#E8F5F3',
    tintMuted: '#B0D9D4',

    scoreExcellent: '#1A8A7D',
    scoreGood: '#5B9E4D',
    scoreFair: '#C4953A',
    scorePoor: '#B85A3A',

    mapPinPlayer: '#1A8A7D',
    mapPinAnswer: '#C4953A',
    mapDistanceLine: '#B85A3A',
    mapSearchBar: '#FFFFFF',

    card: '#F5F5F7',
    border: '#EBEBED',
    tabIconDefault: '#98989D',
    tabIconSelected: '#1A8A7D',
  },
  dark: {
    background: '#121214',
    backgroundSecondary: '#1C1C1E',
    backgroundTertiary: '#2C2C2E',
    overlay: 'rgba(0,0,0,0.7)',

    text: '#F5F5F7',
    secondaryText: '#98989D',
    tertiaryText: '#6B6B70',
    inverseText: '#1A1A1C',

    tint: '#2BBFAD',
    tintPressed: '#239E90',
    tintSubtle: '#1A2F2D',
    tintMuted: '#2A4A46',

    scoreExcellent: '#2BBFAD',
    scoreGood: '#73B765',
    scoreFair: '#E8B04A',
    scorePoor: '#D97B5A',

    mapPinPlayer: '#2BBFAD',
    mapPinAnswer: '#E8B04A',
    mapDistanceLine: '#D97B5A',
    mapSearchBar: '#2C2C2E',

    card: '#1C1C1E',
    border: '#2C2C2E',
    tabIconDefault: '#6B6B70',
    tabIconSelected: '#2BBFAD',
  },
} as const;

export default Colors;
