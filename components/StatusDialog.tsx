'use client';

import { AlertIcon } from './icons';
import { strings } from '@/lib/i18n';
import type { Settings } from '@/lib/types';

interface Props {
  settings: Settings;
  reason: string | null;
  onReload: () => void;
}

export default function StatusDialog({ settings, reason, onReload }: Props) {
  const t = strings(settings.language);
  return (
    <div className="announce status" role="alertdialog" aria-modal="true" aria-label={t.errorTitle}>
      <div className="clay clay-deep announce__card status__card">
        <span className="clay-badge announce__icon status__icon">
          <AlertIcon width={64} height={64} />
        </span>
        <h2 className="status__title">{t.errorTitle}</h2>
        <p className="status__message">{t.errorMessage(reason ?? '')}</p>
        <button type="button" className="announce__dismiss" onClick={onReload}>
          {t.reload}
        </button>
      </div>
    </div>
  );
}
