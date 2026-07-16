/**
 * QuestionsNavBadge — Unanswered-question count badge for the sidebar.
 *
 * Uses useUnansweredCount() which has its own isolated query key
 * (['admin', 'unanswered-count']) so it never conflicts with the
 * filter-based list queries on the questions page.
 */
import { useUnansweredCount } from '../api/use-admin-questions';

export function QuestionsNavBadge() {
  const { data: count } = useUnansweredCount();

  if (!count || count === 0) return null;

  return (
    <span
      className="ml-auto inline-flex items-center justify-center rounded-full bg-[#E8836B] px-2 py-0.5 text-[11px] font-bold leading-none text-white min-w-[20px]"
      aria-label={`${count} preguntas sin responder`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
