"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      }
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
