import dynamic from 'next/dynamic';

const PortalCotacaoScreen = dynamic(() => import('./PortalCotacaoScreen'), {
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

export default function PortalCotacaoPage() {
  return <PortalCotacaoScreen />;
}
