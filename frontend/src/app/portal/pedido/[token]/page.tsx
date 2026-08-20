import dynamic from 'next/dynamic';

const PortalPedidoScreen = dynamic(() => import('./PortalPedidoScreen'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: 'flex',
        flex: 1,
        minHeight: '50vh',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      Carregando...
    </div>
  ),
});

export default function PortalPedidoPage() {
  return <PortalPedidoScreen />;
}
