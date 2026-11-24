'use client';

import { useState } from 'react';
import { btn } from '@/components/admin/ui';
import { DETAIL_LABEL_MAX, DETAIL_VALUE_MAX, MAX_DETAIL_ROWS, type DetailRow } from '@/domain/personal-item';

/** Các dòng "Tên mục – Nội dung" admin tự thêm/xóa; gửi lên dạng detailLabel[] / detailValue[]. */
export function DetailRowsField({ defaultRows }: { defaultRows: DetailRow[] }) {
  const [rows, setRows] = useState(() => (defaultRows.length ? defaultRows : [{ label: '', value: '' }]).map((r, i) => ({ ...r, uid: i })));
  const [nextId, setNextId] = useState(rows.length);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-800">Thông tin thêm</p>
      <p className="text-xs text-zinc-500">Ví dụ: “Chất liệu – Giấy tái chế”, “Lớp – Bao Đồng 1”, “Thời gian làm – 2 tuần”. Dòng không có nội dung sẽ bị bỏ qua.</p>
      {rows.map((row, i) => (
        <div key={row.uid} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <input
            name="detailLabel"
            defaultValue={row.label}
            maxLength={DETAIL_LABEL_MAX}
            placeholder="Tên mục"
            aria-label={`Tên mục dòng ${i + 1}`}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:w-48"
          />
          <span className="hidden text-zinc-400 sm:inline" aria-hidden>–</span>
          <input
            name="detailValue"
            defaultValue={row.value}
            maxLength={DETAIL_VALUE_MAX}
            placeholder="Nội dung"
            aria-label={`Nội dung dòng ${i + 1}`}
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            className={`${btn.ghost} !text-red-600`}
            onClick={() => setRows((r) => r.filter((x) => x.uid !== row.uid))}
            aria-label={`Xóa dòng ${i + 1}`}
          >
            ✕
          </button>
        </div>
      ))}
      {rows.length < MAX_DETAIL_ROWS && (
        <button
          type="button"
          className={btn.secondary}
          onClick={() => {
            setRows((r) => [...r, { label: '', value: '', uid: nextId }]);
            setNextId((n) => n + 1);
          }}
        >
          + Thêm dòng
        </button>
      )}
    </div>
  );
}
