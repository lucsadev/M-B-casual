import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BrandHeaderProps {
  subtitle?: string;
}

export function BrandHeader({ subtitle }: BrandHeaderProps) {
  return (
    <View className="items-center justify-center flex-1">
      <Text
        style={{
          fontFamily: 'CormorantGaramond',
          fontSize: 36,
          fontWeight: '700',
          color: '#1A1A1A',
          lineHeight: 38,
        }}
      >
        M&B
      </Text>
      <Text
        style={{
          fontFamily: 'Montserrat',
          fontSize: 14,
          fontWeight: '300',
          color: '#1A1A1A',
          letterSpacing: 10,
          lineHeight: 18,
        }}
      >
        CASUAL
      </Text>
      {subtitle && (
        <Text
          style={{
            fontFamily: 'Allura',
            fontSize: 20,
            color: '#1A1A1A',
            lineHeight: 24,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

export function BrandHeaderFull({ subtitle }: BrandHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-white items-center justify-center"
      style={{ paddingTop: insets.top + 4, paddingBottom: 8, height: insets.top + 96 }}
    >
      <Text
        style={{
          fontFamily: 'CormorantGaramond',
          fontSize: 28,
          fontWeight: '700',
          color: '#1A1A1A',
          lineHeight: 30,
        }}
      >
        M&B
      </Text>
      <Text
        style={{
          fontFamily: 'Montserrat',
          fontSize: 11,
          fontWeight: '300',
          color: '#1A1A1A',
          letterSpacing: 8,
          lineHeight: 14,
        }}
      >
        CASUAL
      </Text>
      {subtitle && (
        <Text
          style={{
            fontFamily: 'Allura',
            fontSize: 16,
            color: '#1A1A1A',
            lineHeight: 20,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}
