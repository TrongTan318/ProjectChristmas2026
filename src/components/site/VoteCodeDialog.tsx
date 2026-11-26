'use client';

import { useRef, useState } from 'react';
import { ManualCodeForm } from '@/app/(vote)/vote/ManualCodeForm';

/**
 * Nút "Bình chọn" ở trang tác phẩm cho khách CHƯA có phiên bình chọn (chưa quét QR / chưa nhập mã),
 * chỉ hiện khi đang trong giờ bình chọn. Mở popup nhập mã 5 ký tự → đúng mã thì sang /binh-chon
 * với tác phẩm này chọn sẵn, người dùng vẫn phải bấm "Xác nhận bình chọn".
 * Dùng <dialog> gốc (Esc để đóng, focus tự quay lại nút), không dùng thư viện hiệu ứng.
 */
export function VoteCodeDialog({ productId, productName }: { productId: string; productName: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  // Chỉ gắn form khi popup mở → mỗi lần mở là form mới (xóa lỗi cũ) và tự focus ô nhập.
  const [open, setOpen] = useState(false);
  const titleId = `vote-dialog-${productId}`;

  const show = () => {
    setOpen(true);
    ref.current?.showModal();
  };
  const close = () => ref.current?.close();

  return (
    <>
      <button type="button" onClick={show} className="btn-glass text-lg" aria-haspopup="dialog">
        ★ Bình chọn hang đá này
      </button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        // Bấm ra nền tối bên ngoài khung → đóng
        onClick={(e) => {
          if (e.target === ref.current) close();
        }}
        className="surface-light m-auto max-h-[90svh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl bg-ivory p-0 text-left text-ink shadow-2xl backdrop:bg-ink/75"
      >
        <div className="p-6 sm:p-8">
          <h2 id={titleId} className="font-serif text-2xl font-bold text-burgundy-dark sm:text-3xl">Nhập mã vote</h2>
          <p className="mt-3 text-lg leading-relaxed text-ink/80">
            Bình chọn cho <strong className="text-burgundy-dark">{productName}</strong>. Nhập mã 5 ký tự in trên phiếu bình chọn:
          </p>
          {open && <ManualCodeForm choiceId={productId} autoFocus />}
          <p className="mt-5 text-lg leading-relaxed text-ink/70">Có phiếu QR? Mở camera điện thoại và quét mã trên phiếu.</p>
          <button type="button" onClick={close} className="btn-glass-clear mt-5 w-full !py-3 text-lg">
            Đóng
          </button>
        </div>
      </dialog>
    </>
  );
}
