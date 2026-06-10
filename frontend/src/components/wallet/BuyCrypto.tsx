// Thirdweb Buy Widget — the prebuilt checkout, themed to juzz. Per the docs, this is used
// as-is; we only set the brand colors + token/receiver. This module owns ALL thirdweb
// imports so the (heavy) SDK is code-split into its own lazy chunk (loaded on demand).
import { createThirdwebClient, defineChain } from 'thirdweb';
import { BuyWidget, ThirdwebProvider, darkTheme } from 'thirdweb/react';
import { THIRDWEB_CLIENT_ID, CHAIN_ID } from '../../lib/config';

const client = createThirdwebClient({ clientId: THIRDWEB_CLIENT_ID });

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
    borderColor: '#2A2A35',
  },
});

export default function BuyCrypto({
  receiverAddress, tokenAddress, onDone,
}: {
  receiverAddress: string;
  tokenAddress: string;
  onDone: () => void;
}) {
  return (
    <ThirdwebProvider>
      <BuyWidget
        client={client}
        chain={defineChain(CHAIN_ID)}
        tokenAddress={tokenAddress as `0x${string}`}
        receiverAddress={receiverAddress as `0x${string}`}
        amount="2"
        currency="USD"
        buttonLabel="Deposit"
        theme={theme}
        showThirdwebBranding={false}
        onSuccess={onDone}
      />
    </ThirdwebProvider>
  );
}
