"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type ActionResult = { success?: boolean; message?: string } | void;

type AdminDeleteButtonProps = {
  action: (id: string) => Promise<ActionResult>;
  id: string;
  label?: string;
  className?: string;
  confirmMessage?: string;
};

export function AdminDeleteButton({
  action,
  id,
  label = "Delete",
  className,
  confirmMessage = "Are you sure you want to delete this item?",
}: AdminDeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(confirmMessage)) return;

    startTransition(async () => {
      await action(id);
      router.refresh();
    });
  }

  return (
    <button type="button" onClick={handleClick} disabled={isPending} className={className}>
      {isPending ? "Deleting..." : label}
    </button>
  );
}