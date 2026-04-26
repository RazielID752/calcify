"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export default function Toaster(props: ToasterProps) {
  return <Sonner position="top-right" richColors closeButton {...props} />;
}
