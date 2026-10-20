import { useMemo } from 'react';
import {
  AlertDialog,
  ConfirmBottomSheet,
  ConfirmCard,
  PriorityMessageDialog,
  PromptDialog,
  PushMessageDialog,
  type ParamDialog,
} from './LegacyDialogs';
import { useDialog } from './useDialog';

/** Équivalent du ModalService Angular (core/services/modal.service.ts). */
export function useModal() {
  const open = useDialog();
  return useMemo(
    () => ({
      alert: (data: ParamDialog) =>
        open<undefined>((d) => <AlertDialog data={data} dialog={d} />, {
          panelClass: 'cPersonnal',
          backdropClass: 'startBackDrop',
          disableClose: true,
        }),
      confirm: (data: ParamDialog) =>
        open<boolean>((d) => <ConfirmCard data={data} dialog={d} />, {
          panelClass: 'cPersonnal',
          backdropClass: 'startBackDrop',
        }),
      prompt: (data: ParamDialog) => open<string>((d) => <PromptDialog data={data} dialog={d} />, { width: '480px' }),
      bottomConfirm: (data: ParamDialog) =>
        open<boolean>((d) => <ConfirmBottomSheet data={data} dialog={d} />, { bottomSheet: true }),
      showPushMessage: (data: ParamDialog) =>
        open<undefined>((d) => <PushMessageDialog data={data} dialog={d} />, {
          panelClass: 'cPersonnal',
          backdropClass: 'startBackDrop',
          width: '400px',
          disableClose: !!data.actionBtn,
        }),
      showPriorityMessage: (data: ParamDialog) =>
        open<undefined>((d) => <PriorityMessageDialog data={data} dialog={d} />, {
          panelClass: 'cPersonnal',
          backdropClass: 'startBackDrop',
          width: '600px',
          disableClose: !!data.actionBtn,
        }),
    }),
    [open],
  );
}
