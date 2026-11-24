import { ActionForm, SubmitButton } from '@/components/admin/ActionForm';
import { Checkbox, Field, Input, Textarea } from '@/components/admin/ui';
import type { DetailRow } from '@/domain/personal-item';
import { saveItem } from './actions';
import { DetailRowsField } from './DetailRowsField';

export interface ItemFormValues {
  id: string;
  name: string;
  maker: string;
  meaning: string;
  details: DetailRow[];
  isActive: boolean;
}

/** Form thêm / sửa vật phẩm cá nhân (tên, người làm, ý nghĩa, thông tin thêm, hiển thị). */
export function ItemForm({ item }: { item?: ItemFormValues }) {
  return (
    <ActionForm action={saveItem} className="space-y-4">
      {item && <input type="hidden" name="id" value={item.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tên vật phẩm *"><Input name="name" required maxLength={160} defaultValue={item?.name} /></Field>
        <Field label="Người làm"><Input name="maker" maxLength={120} defaultValue={item?.maker} /></Field>
      </div>
      <Field label="Ý nghĩa" hint="Hiển thị dạng chữ; xuống dòng được giữ nguyên">
        <Textarea name="meaning" rows={5} maxLength={3000} defaultValue={item?.meaning} />
      </Field>
      <DetailRowsField defaultRows={item?.details ?? []} />
      <Checkbox name="isActive" label="Hiển thị trên website" defaultChecked={item?.isActive ?? true} />
      <div><SubmitButton>{item ? 'Lưu' : '+ Thêm vật phẩm'}</SubmitButton></div>
    </ActionForm>
  );
}
