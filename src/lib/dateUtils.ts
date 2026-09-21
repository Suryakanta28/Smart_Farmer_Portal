// Dynamic Date & Real-Time Clock Formatting Utility
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

/**
 * Format date to standard Indian locale format: "21 Sep 2026"
 */
export const formatLiveDate = (dateInput?: string | number | Date): string => {
  if (!dateInput) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * Format time to 12-hour AM/PM format: "01:30:45 PM"
 */
export const formatLiveTime = (dateInput?: string | number | Date, includeSeconds = true): string => {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true,
  });
};

/**
 * Format full date and time: "21 Sep 2026, 01:30 PM"
 */
export const formatLiveDateTime = (dateInput?: string | number | Date): string => {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return '';
  return `${formatLiveDate(d)}, ${formatLiveTime(d, false)}`;
};

/**
 * Get human-readable dynamic relative time ("Just now", "2 mins ago", "1 hr ago", "Yesterday")
 */
export const formatTimeAgo = (dateInput?: string | number | Date): string => {
  if (!dateInput) return 'Just now';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Recently';

  const diffMs = Date.now() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 15) return 'Just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatLiveDate(d);
};
