import * as React from "react";
import { redirect } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Add Clerk role check here
  // const { userId, sessionClaims } = auth();
  // if (!userId || sessionClaims?.metadata?.role !== 'admin') {
  //   redirect('/dashboard');
  // }

  return <>{children}</>;
}
