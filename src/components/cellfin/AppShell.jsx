import BottomNav from './BottomNav';
import PageTransition from './PageTransition';

// AppShell: Header outside scroll, content inside, bottom nav fixed
export default function AppShell({ header, children }) {
  return (
    <div
      className="max-w-[430px] mx-auto font-inter flex flex-col bg-[#f8f9fa]"
      style={{
        height: '100dvh',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        maxWidth: '430px',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Header — Fixed, outside scroll container */}
      {header}

      {/* Content — Only this scrolls, with automatic offset for fixed header */}
      <main className="flex-1 overflow-y-auto pb-24"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          scrollBehavior: 'smooth',
          WebkitOverscrollBehavior: 'none',
          paddingTop: 'max(1rem, calc(1rem + env(safe-area-inset-top)))',
        }}>
        <PageTransition>{children}</PageTransition>
      </main>

      {/* Bottom Nav — Fixed, safe-area aware */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <BottomNav />
      </div>
    </div>
  );
}