import { LayoutIcon } from '@/components/admin/LayoutIcon';
import { LAYOUT_INFO, STAGE_LAYOUTS, type StageLayout } from '@/domain/stage';

/** Chọn 1 trong 6 kiểu khung (radio + hình minh họa); dùng cho giai đoạn và khung ảnh đẹp. */
export function LayoutPicker({ name, value, label }: { name: string; value: StageLayout; label: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-zinc-800">Kiểu khung</p>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={label}>
        {STAGE_LAYOUTS.map((layout) => (
          <label key={layout} className="cursor-pointer" title={LAYOUT_INFO[layout].hint}>
            <input type="radio" name={name} value={layout} defaultChecked={value === layout} className="peer sr-only" />
            <span className="block rounded-lg border border-zinc-200 bg-white p-1.5 text-center transition peer-checked:border-burgundy peer-checked:ring-2 peer-checked:ring-burgundy/40 peer-focus-visible:ring-2 peer-focus-visible:ring-gold hover:border-zinc-400">
              <LayoutIcon layout={layout} className="mx-auto h-auto w-full" />
              <span className="mt-1 block text-[11px] leading-tight text-zinc-700">{LAYOUT_INFO[layout].name}</span>
            </span>
          </label>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-zinc-500">{LAYOUT_INFO[value].hint}</p>
    </div>
  );
}
