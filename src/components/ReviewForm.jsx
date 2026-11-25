import { useState } from 'react'
import StarRating from './StarRating'

export const MAX_COMMENT_LENGTH = 280

//const RATING_LABELS = ['', 'Huono', 'Välttävä', 'Ihan ok', 'Hyvä', 'Erinomainen']

export default function ReviewForm({
  initialRating = 0,
  initialComment = '',
  isEditing = false,
  saving = false,
  error = null,
  onSubmit,
  onCancel,
}) {
  const [rating, setRating] = useState(initialRating)
  const [comment, setComment] = useState(initialComment)
  const [localError, setLocalError] = useState(null)

  const remaining = MAX_COMMENT_LENGTH - comment.length

  // Muokatessa tallennus on mahdollista vasta, kun jokin on muuttunut
  const unchanged =
    isEditing &&
    rating === initialRating &&
    comment.trim() === (initialComment || '').trim()

  const counterClass =
    remaining <= 0
      ? 'text-red-600 dark:text-red-400 font-semibold'
      : remaining <= 20
        ? 'text-amber-700 dark:text-amber-400'
        : 'text-gray-500 dark:text-gray-400'

  const handleSubmit = (e) => {
    e.preventDefault()

    // Tähtiarvio on pakollinen, kommentti valinnainen
    if (rating < 1) {
      setLocalError('Valitse ensin tähtimäärä (1–5)')
      return
    }

    setLocalError(null)
    onSubmit({ rating, comment: comment.trim() })
  }

  const shownError = localError || error

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      {/* Tähdet ja valitun määrän teksti */}
      <div className="flex flex-wrap items-center gap-3">
        <StarRating
          value={rating}
          size="lg"
          disabled={saving}
          onChange={(n) => {
            setRating(n)
            if (localError) setLocalError(null)
          }}
        />
        <span className="text-sm font-semibold">
          {rating > 0 ? (
            <>
              {rating} / 5
              <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">
                
              </span>
            </>
          ) : (
            <span className="font-normal text-gray-500 dark:text-gray-400">
              Valitse omenat
            </span>
          )}
        </span>
      </div>

      {/* Kommentti ja merkkilaskuri */}
      <div>
        <label htmlFor="review-comment" className="sr-only">
          Kommentti (valinnainen)
        </label>
        <textarea
          id="review-comment"
          value={comment}
          maxLength={MAX_COMMENT_LENGTH}
          rows={3}
          disabled={saving}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Kirjoita lyhyt kommentti (valinnainen)"
          className="w-full px-3.5 py-2.5 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 resize-none disabled:opacity-60"
        />
        <p className={`mt-1 text-xs text-right ${counterClass}`}>
          Jäljellä {remaining} merkkiä
        </p>
      </div>

      {shownError && (
        <p className="text-xs text-red-700 dark:text-red-300">{shownError}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || unchanged}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving
            ? 'Tallennetaan...'
            : isEditing
              ? 'Tallenna muutokset'
              : 'Julkaise arvostelu'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition cursor-pointer disabled:opacity-50"
          >
            Peruuta
          </button>
        )}
      </div>
    </form>
  )
}