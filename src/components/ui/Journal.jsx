import { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext.jsx';

export default function Journal() {
  const { currentStory, journalOpen, closeJournal, journalPages } = useGame();
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    if (pageIndex >= journalPages.length) {
      setPageIndex(0);
    }
  }, [journalPages.length, pageIndex]);

  if (!journalOpen) {
    return null;
  }

  const safePageIndex = Math.min(pageIndex, Math.max(journalPages.length - 1, 0));
  const spreadIndex = safePageIndex % 2 === 0 ? safePageIndex : safePageIndex - 1;
  const leftPage = journalPages[spreadIndex];
  const rightPage = journalPages[spreadIndex + 1];
  const canPrev = spreadIndex > 0;
  const canNext = spreadIndex + 2 < journalPages.length;

  return (
    <div className="modal-backdrop">
      <section className="journal-modal" role="dialog" aria-modal="true" aria-label={currentStory.journalName}>
        <button className="close-button" type="button" onClick={closeJournal}>
          Закрыть
        </button>
        <div className="journal-spread">
          <article className="journal-page">
            <span className="page-number">Страница {spreadIndex + 1}</span>
            <h2>{leftPage.title}</h2>
            <p>{leftPage.text}</p>
          </article>
          <article className="journal-page">
            {rightPage ? (
              <>
                <span className="page-number">Страница {spreadIndex + 2}</span>
                <h2>{rightPage.title}</h2>
                <p>{rightPage.text}</p>
              </>
            ) : (
              <div className="empty-page">
                <h2>Следующая запись ждёт разгадку</h2>
                <p>Дневник чуть шуршит страницей, но пока молчит.</p>
              </div>
            )}
          </article>
        </div>
        <div className="journal-controls">
          <button className="secondary-button" type="button" onClick={() => setPageIndex(spreadIndex - 2)} disabled={!canPrev}>
            Назад
          </button>
          <button className="secondary-button" type="button" onClick={() => setPageIndex(spreadIndex + 2)} disabled={!canNext}>
            Вперёд
          </button>
        </div>
      </section>
    </div>
  );
}
