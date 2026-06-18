/**
 * P2 OPTIMIZATION: Pagination & virtualization
 * - Handles large lists efficiently
 * - Lazy-loads data
 * - Virtual scrolling for 1000+ items
 */

export class PaginationManager {
  constructor(totalCount, pageSize = 20) {
    this.totalCount = totalCount;
    this.pageSize = pageSize;
    this.currentPage = 1;
  }

  getTotalPages() {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  getOffset() {
    return (this.currentPage - 1) * this.pageSize;
  }

  getLimit() {
    return this.pageSize;
  }

  hasNextPage() {
    return this.currentPage < this.getTotalPages();
  }

  hasPreviousPage() {
    return this.currentPage > 1;
  }

  nextPage() {
    if (this.hasNextPage()) this.currentPage++;
  }

  previousPage() {
    if (this.hasPreviousPage()) this.currentPage--;
  }

  goToPage(page) {
    const totalPages = this.getTotalPages();
    this.currentPage = Math.max(1, Math.min(page, totalPages));
  }
}

// React hook for paginated queries
import React from 'react';

export function usePaginatedQuery(fetchFn, pageSize = 20) {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [totalCount, setTotalCount] = React.useState(0);
  const [page, setPage] = React.useState(1);

  const pagination = React.useMemo(
    () => new PaginationManager(totalCount, pageSize),
    [totalCount, pageSize]
  );

  React.useEffect(() => {
    pagination.goToPage(page);
  }, [page, pagination]);

  const loadPage = React.useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      try {
        const offset = (pageNum - 1) * pageSize;
        const result = await fetchFn(offset, pageSize);

        setData(result.data || []);
        setTotalCount(result.total || 0);
        setPage(pageNum);
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, pageSize]
  );

  return {
    data,
    loading,
    page,
    totalPages: pagination.getTotalPages(),
    hasNextPage: pagination.hasNextPage(),
    hasPreviousPage: pagination.hasPreviousPage(),
    loadPage,
    nextPage: () => loadPage(page + 1),
    prevPage: () => loadPage(page - 1),
  };
}

// Virtual scrolling component
export function VirtualScroller({ items, itemHeight, containerHeight, renderItem }) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = startIndex + Math.ceil(containerHeight / itemHeight);
  const visibleItems = items.slice(Math.max(0, startIndex - 5), endIndex + 5);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, idx) => (
            <div key={startIndex + idx - 5} style={{ height: itemHeight }}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}