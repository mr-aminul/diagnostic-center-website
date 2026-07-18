import { redirect } from "next/navigation";

export default async function AdminBookingDetailV2RedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/bookings/${id}`);
}
