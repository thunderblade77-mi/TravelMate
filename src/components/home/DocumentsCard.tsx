type DocumentsCardProps = {
  documentAlertCount: number
  expiredDocumentCount: number
  expiringDocumentCount: number
  onOpenDocuments: () => void
}

export default function DocumentsCard({
  documentAlertCount,
  expiredDocumentCount,
  expiringDocumentCount,
  onOpenDocuments,
}: DocumentsCardProps) {
  if (documentAlertCount === 0) {
    return null
  }

  return (
    <button
      type="button"
      onClick={onOpenDocuments}
      className="mt-5 flex w-full items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left transition active:scale-[0.99]"
    >
      <span className="text-2xl">
        {expiredDocumentCount > 0 ? '⚠️' : '⏰'}
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-amber-900">
          Documenti da controllare
        </p>

        <p className="mt-1 text-sm leading-5 text-amber-700">
          {expiredDocumentCount > 0 && (
            <>
              {expiredDocumentCount}{' '}
              {expiredDocumentCount === 1
                ? 'documento scaduto'
                : 'documenti scaduti'}
            </>
          )}

          {expiredDocumentCount > 0 &&
            expiringDocumentCount > 0 &&
            ' · '}

          {expiringDocumentCount > 0 && (
            <>
              {expiringDocumentCount} in scadenza
            </>
          )}
        </p>
      </div>

      <span className="shrink-0 text-amber-700">
        →
      </span>
    </button>
  )
}