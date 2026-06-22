import { useCallback, useRef, useState } from 'react';
import { resolveProductImageUrl } from '../../utils/productImages.js';

/**
 * @param {{
 *   label: string,
 *   hint?: string,
 *   file?: File | null,
 *   existingUrl?: string,
 *   onFileChange: (file: File | null) => void,
 *   multiple?: boolean,
 *   maxFiles?: number,
 *   files?: File[],
 *   onFilesChange?: (files: File[]) => void,
 *   required?: boolean,
 * }} props
 */
export function ImageUploadZone({
  label,
  hint,
  file = null,
  existingUrl = '',
  onFileChange,
  multiple = false,
  maxFiles = 4,
  files = [],
  onFilesChange,
  required = false,
}) {
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const [dragOver, setDragOver] = useState(false);

  const previewUrl = file
    ? URL.createObjectURL(file)
    : existingUrl
      ? resolveProductImageUrl(existingUrl)
      : '';

  const galleryPreviews = multiple
    ? [
        ...files.map((f) => ({ type: 'file', src: URL.createObjectURL(f), name: f.name })),
      ]
    : [];

  const handleFiles = useCallback(
    (list) => {
      const picked = Array.from(list || []).filter((f) => f.type.startsWith('image/'));
      if (multiple && onFilesChange) {
        onFilesChange(picked.slice(0, maxFiles));
      } else if (picked[0]) {
        onFileChange(picked[0]);
      }
    },
    [multiple, maxFiles, onFileChange, onFilesChange],
  );

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-neutral-900">
          {label}
          {required ? <span className="text-brand-red"> *</span> : null}
        </p>
        {hint ? <p className="mt-0.5 text-xs text-neutral-500">{hint}</p> : null}
      </div>

      {!multiple ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition ${
            dragOver
              ? 'border-brand-red bg-brand-red/5'
              : 'border-neutral-200 bg-neutral-50/80 hover:border-neutral-300'
          }`}
        >
          {previewUrl ? (
            <div className="relative">
              <img src={previewUrl} alt="" className="mx-auto max-h-56 w-full object-contain p-4" />
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent p-3">
                <span className="truncate text-xs font-medium text-white">
                  {file?.name || 'Current photo'}
                </span>
                <button
                  type="button"
                  onClick={() => onFileChange(null)}
                  className="shrink-0 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold text-neutral-900 hover:bg-white"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 px-6 py-10 text-center"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                <svg className="size-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.57c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </span>
              <span className="text-sm font-semibold text-neutral-800">Upload a photo</span>
              <span className="text-xs text-neutral-500">Drag & drop or tap to choose · JPG, PNG, WebP</span>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
              dragOver ? 'border-brand-red bg-brand-red/5' : 'border-neutral-200 bg-neutral-50/80'
            }`}
          >
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-sm font-semibold text-brand-red hover:underline"
            >
              Add gallery photos
            </button>
            <p className="mt-1 text-xs text-neutral-500">Up to {maxFiles} images · drag & drop supported</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/*"
              className="sr-only"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
          {galleryPreviews.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {galleryPreviews.map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white">
                  <img src={item.src} alt="" className="aspect-square w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => onFilesChange?.(files.filter((_, i) => i !== idx))}
                    className="absolute right-1.5 top-1.5 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
