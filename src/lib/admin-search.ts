export type AdminSearchHit = {
  id: string;
  kind: "booking" | "appointment" | "inquiry";
  title: string;
  subtitle: string;
  href: string;
};

export type AdminNotification = {
  id: string;
  title: string;
  body: string;
  href: string;
  createdAt: string;
};
