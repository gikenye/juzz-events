// Thirdweb Buy Widget — buy USDC on Celo with card or crypto, delivered to the user's
// juzz wallet. This module owns ALL thirdweb imports so the (heavy) SDK is code-split
// into its own lazy chunk and never touches the main bundle. Loaded via React.lazy.
import { createThirdwebClient, defineChain } from 'thirdweb';
import { BuyWidget, ThirdwebProvider, darkTheme } from 'thirdweb/react';
import { THIRDWEB_CLIENT_ID, CHAIN_ID, USDC } from '../../lib/config';

const client = createThirdwebClient({ clientId: THIRDWEB_CLIENT_ID });
const celo = defineChain(CHAIN_ID);

// juzz palette — gold/ivory on deep black; thirdweb branding is turned off below.
const theme = darkTheme({
  colors: {
    modalBg: '#0B0B0F',
    primaryText: '#F5F0E8',
    secondaryText: '#9A9AAF',
    accentText: '#C9A227',
    accentButtonBg: '#C9A227',
    accentButtonText: '#0B0B0F',
    primaryButtonBg: '#C9A227',
    primaryButtonText: '#0B0B0F',
    secondaryButtonBg: '#1C1C24',
    secondaryButtonText: '#F5F0E8',
    borderColor: '#2A2A35',
    separatorLine: '#2A2A35',
    tertiaryBg: '#141418',
    connectedButtonBg: '#141418',
    skeletonBg: '#1C1C24',
    tooltipBg: '#1C1C24',
  },
});

export default function BuyCrypto({
  receiverAddress, country, onDone,
}: {
  receiverAddress: string;
  country?: string;
  onDone: () => void;
}) {
  return (
    <ThirdwebProvider>
      <BuyWidget
        client={client}
        chain={celo}
        tokenAddress={USDC as `0x${string}`}
        receiverAddress={receiverAddress as `0x${string}`}
        theme={theme}
        showThirdwebBranding={false}
        paymentMethods={['card', 'crypto']}
        country={country}
        currency="USD"
        title="Add funds"
        presetOptions={[2, 5, 10]}
        onSuccess={onDone}
      />
    </ThirdwebProvider>
  );
}
