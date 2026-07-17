"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FocusEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Building2, Home } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GenderRadioGroup, type GenderValue } from "@/components/gender-radio-group";
import {
  CatalogItemCombobox,
  type CatalogPaymentDraft,
  type CatalogPickItem,
  type SelectedCatalogItem,
} from "@/components/admin/catalog-item-combobox";
import { BookingSection } from "@/components/admin/booking-workspace";
import {
  createAdminTestBooking,
  type AdminBookBookingState,
} from "@/app/admin/(protected)/bookings/actions";
import { updateBookingDetails } from "@/app/admin/(protected)/bookings/[id]/actions";
import {
  BD_PHONE_HINT,
  isPlausibleBdPhone,
  sanitizeAgeInput,
  sanitizeBdPhoneInput,
} from "@/lib/phone";
import { TIME_SLOT_VALUES, todayDateInputValue } from "@/lib/time-slots";
import { cn } from "@/lib/utils";

export interface BookableBranch {
  id: string;
  name: string;
}

export type BookingFormDefaults = {
  patientName: string;
  phone: string;
  age: number | null;
  gender: GenderValue | null;
  collectionType: "IN_CENTER" | "HOME";
  address: string | null;
  branchId: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  notes: string | null;
};

const createInitial: AdminBookBookingState = { status: "idle" };
const DETAILS_AUTOSAVE_MS = 500;
const DETAILS_TOAST_ID = "booking-details-autosave";

type DetailsSnapshot = {
  patientName: string;
  phone: string;
  age: string;
  gender: GenderValue | "";
  collectionType: "IN_CENTER" | "HOME";
  address: string;
  branchId: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
};

function serializeDetails(snapshot: DetailsSnapshot) {
  return JSON.stringify(snapshot);
}

function patientIdentityKey(snapshot: DetailsSnapshot) {
  return JSON.stringify({
    patientName: snapshot.patientName,
    phone: snapshot.phone,
    age: snapshot.age,
    gender: snapshot.gender,
  });
}

function patientIdentityChanged(
  previous: DetailsSnapshot,
  next: DetailsSnapshot,
) {
  return patientIdentityKey(previous) !== patientIdentityKey(next);
}

function nonIdentityKey(snapshot: DetailsSnapshot) {
  return JSON.stringify({
    collectionType: snapshot.collectionType,
    address: snapshot.address,
    branchId: snapshot.branchId,
    preferredDate: snapshot.preferredDate,
    preferredTime: snapshot.preferredTime,
    notes: snapshot.notes,
  });
}

function withSavedIdentity(
  live: DetailsSnapshot,
  saved: DetailsSnapshot,
): DetailsSnapshot {
  return {
    ...live,
    patientName: saved.patientName,
    phone: saved.phone,
    age: saved.age,
    gender: saved.gender,
  };
}

function canAutosaveDetails(snapshot: DetailsSnapshot) {
  if (!snapshot.patientName.trim() || !isPlausibleBdPhone(snapshot.phone)) {
    return false;
  }
  if (!snapshot.gender) return false;
  return true;
}

function detailsFormData(snapshot: DetailsSnapshot) {
  const formData = new FormData();
  formData.set("collectionType", snapshot.collectionType);
  formData.set("patientName", snapshot.patientName);
  formData.set("phone", snapshot.phone);
  formData.set("age", snapshot.age);
  formData.set("gender", snapshot.gender);
  formData.set("notes", snapshot.notes);
  if (snapshot.collectionType === "HOME") {
    formData.set("address", snapshot.address);
    formData.set("preferredDate", snapshot.preferredDate);
    formData.set("preferredTime", snapshot.preferredTime);
  } else {
    if (snapshot.branchId) formData.set("branchId", snapshot.branchId);
    if (snapshot.preferredDate) formData.set("preferredDate", snapshot.preferredDate);
  }
  return formData;
}

export function AdminBookingForm({
  mode,
  catalog,
  branches,
  bookingId,
  defaults,
  invoice,
}: {
  mode: "create" | "edit";
  catalog: CatalogPickItem[];
  branches: BookableBranch[];
  bookingId?: string;
  defaults?: BookingFormDefaults;
  /** Edit-mode invoice / payment panel, shown above notes & visit. */
  invoice?: ReactNode;
}) {
  const router = useRouter();
  const [createState, createFormAction, createPending] = useActionState(
    createAdminTestBooking,
    createInitial,
  );
  const [savePending, startSave] = useTransition();

  const [selected, setSelected] = useState<SelectedCatalogItem[]>([]);
  const [paymentDraft, setPaymentDraft] = useState<CatalogPaymentDraft | null>(null);

  const [patientName, setPatientName] = useState(defaults?.patientName ?? "");
  const [phone, setPhone] = useState(() =>
    sanitizeBdPhoneInput(defaults?.phone ?? ""),
  );
  const [age, setAge] = useState(() =>
    defaults?.age != null ? sanitizeAgeInput(String(defaults.age)) : "",
  );
  const [gender, setGender] = useState<GenderValue | "">(defaults?.gender ?? "");
  const [collectionType, setCollectionType] = useState<"IN_CENTER" | "HOME">(
    defaults?.collectionType ?? "IN_CENTER",
  );
  const [address, setAddress] = useState(defaults?.address ?? "");
  const [branchId, setBranchId] = useState(
    defaults?.branchId ?? branches[0]?.id ?? "",
  );
  const [preferredDate, setPreferredDate] = useState(
    defaults?.preferredDate ?? "",
  );
  const [preferredTime, setPreferredTime] = useState(
    defaults?.preferredTime ?? "",
  );
  const [notes, setNotes] = useState(defaults?.notes ?? "");
  const [patientConfirmOpen, setPatientConfirmOpen] = useState(false);
  const [pendingPatient, setPendingPatient] = useState<DetailsSnapshot | null>(
    null,
  );

  const detailsSnapshot: DetailsSnapshot = {
    patientName,
    phone,
    age,
    gender,
    collectionType,
    address,
    branchId,
    preferredDate,
    preferredTime,
    notes,
  };
  const detailsKey = serializeDetails(detailsSnapshot);
  const lastSavedRef = useRef<DetailsSnapshot | null>(
    mode === "edit" ? detailsSnapshot : null,
  );
  const detailsSnapshotRef = useRef(detailsSnapshot);
  detailsSnapshotRef.current = detailsSnapshot;
  /** True from schedule → close so blur/click races cannot open twice or discard. */
  const patientConfirmArmedRef = useRef(false);
  const openPatientConfirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  /** Drops stale autosave results when a newer persist is already in flight. */
  const detailsSaveSeqRef = useRef(0);

  const idPrefix = mode === "create" ? "new" : "edit";

  function closePatientConfirm() {
    if (openPatientConfirmTimerRef.current != null) {
      window.clearTimeout(openPatientConfirmTimerRef.current);
      openPatientConfirmTimerRef.current = null;
    }
    patientConfirmArmedRef.current = false;
    setPendingPatient(null);
    setPatientConfirmOpen(false);
  }

  function persistDetails(snapshot: DetailsSnapshot) {
    if (!bookingId) return;
    const seq = ++detailsSaveSeqRef.current;
    startSave(async () => {
      const result = await updateBookingDetails(
        bookingId,
        { status: "idle" },
        detailsFormData(snapshot),
      );
      if (seq !== detailsSaveSeqRef.current) return;
      if (result.status === "success") {
        lastSavedRef.current = snapshot;
        // Close the patient dialog only when we persisted the live identity
        // (confirm), not when visit/notes were saved with the previous identity.
        if (!patientIdentityChanged(snapshot, detailsSnapshotRef.current)) {
          closePatientConfirm();
        }
        toast.success("Saved", { id: DETAILS_TOAST_ID });
        return;
      }
      toast.error(result.error ?? "Could not save booking details.", {
        id: DETAILS_TOAST_ID,
      });
    });
  }

  function discardPatientChanges() {
    const lastSaved = lastSavedRef.current;
    if (lastSaved) {
      setPatientName(lastSaved.patientName);
      setPhone(lastSaved.phone);
      setAge(lastSaved.age);
      setGender(lastSaved.gender);
    }
    closePatientConfirm();
  }

  /**
   * Ask only after leaving the Patient section — never mid-keystroke.
   * Open is deferred so the click that blurred the field cannot dismiss the dialog.
   */
  function requestPatientConfirm() {
    if (mode !== "edit" || !bookingId) return;
    if (patientConfirmArmedRef.current || patientConfirmOpen) return;

    const saved = lastSavedRef.current;
    const snapshot = detailsSnapshotRef.current;
    if (!saved) return;
    if (!patientIdentityChanged(saved, snapshot)) return;
    if (!canAutosaveDetails(snapshot)) {
      toast.error("Enter a valid name and phone before updating patient details.", {
        id: DETAILS_TOAST_ID,
      });
      return;
    }

    patientConfirmArmedRef.current = true;
    // Flag only — confirm always persists the live snapshot so Visit/notes
    // changes from the same click are not overwritten by a stale capture.
    setPendingPatient(snapshot);

    if (openPatientConfirmTimerRef.current != null) {
      window.clearTimeout(openPatientConfirmTimerRef.current);
    }
    // Let the blur-causing pointer event finish before mounting the modal.
    openPatientConfirmTimerRef.current = setTimeout(() => {
      openPatientConfirmTimerRef.current = null;
      setPatientConfirmOpen(true);
    }, 0);
  }

  function onPatientSectionBlur(event: FocusEvent<HTMLDivElement>) {
    if (mode !== "edit") return;
    const nextFocus = event.relatedTarget as Node | null;
    if (nextFocus && event.currentTarget.contains(nextFocus)) return;
    requestPatientConfirm();
  }

  function onPatientConfirmOpenChange(open: boolean) {
    if (open) {
      setPatientConfirmOpen(true);
      return;
    }
    // Ignore spurious closes while arming / opening (same-click outside dismiss).
    if (!patientConfirmOpen && patientConfirmArmedRef.current) return;
    discardPatientChanges();
  }

  function confirmPatientUpdate() {
    const snapshot = detailsSnapshotRef.current;
    if (!canAutosaveDetails(snapshot)) {
      toast.error("Enter a valid name and phone before updating patient details.", {
        id: DETAILS_TOAST_ID,
      });
      return;
    }
    persistDetails(snapshot);
  }

  useEffect(() => {
    return () => {
      if (openPatientConfirmTimerRef.current != null) {
        window.clearTimeout(openPatientConfirmTimerRef.current);
      }
    };
  }, []);

  const createNetTotal = selected.reduce(
    (sum, item) => sum + item.price - item.discount,
    0,
  );
  const createNetRounded = Math.max(0, Math.round(createNetTotal * 100) / 100);
  const effectivePaymentIntent = paymentDraft != null ? "collect" : "unpaid";

  useEffect(() => {
    if (mode !== "create") return;
    if (createState.status === "success" && createState.bookingId) {
      toast.success(
        createState.referenceCode
          ? `Booking ${createState.referenceCode} created.`
          : "Booking created.",
      );
      router.push(`/admin/bookings/${createState.bookingId}`);
      return;
    }
    if (createState.status === "error" && createState.error) {
      toast.error(createState.error);
    }
  }, [createState, mode, router]);

  useEffect(() => {
    if (mode !== "edit" || !bookingId) return;
    const lastSaved = lastSavedRef.current;
    if (!lastSaved) return;
    if (detailsKey === serializeDetails(lastSaved)) return;

    const identityDirty = patientIdentityChanged(lastSaved, detailsSnapshot);
    const visitDirty =
      nonIdentityKey(lastSaved) !== nonIdentityKey(detailsSnapshot);

    // Identity-only edits wait for the leave-section confirm dialog.
    if (identityDirty && !visitDirty) return;
    // Nothing visit-related to save (and identity is clean).
    if (!visitDirty) return;

    const timer = window.setTimeout(() => {
      const live = detailsSnapshotRef.current;
      const saved = lastSavedRef.current;
      if (!saved) return;
      if (nonIdentityKey(saved) === nonIdentityKey(live)) return;

      // While identity is pending confirm, persist visit/notes with the
      // last-saved identity so a Home/notes click is never silently dropped.
      const payload = patientIdentityChanged(saved, live)
        ? withSavedIdentity(live, saved)
        : live;
      if (!canAutosaveDetails(payload)) return;
      persistDetails(payload);
    }, DETAILS_AUTOSAVE_MS);

    return () => window.clearTimeout(timer);
    // Snapshot fields are represented by detailsKey; intentionally omit the object.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce on serialized details only
  }, [mode, bookingId, detailsKey]);

  return (
    <div className="flex flex-col gap-4">
      <form
        key={`${idPrefix}-details-form`}
        action={mode === "create" ? createFormAction : undefined}
        onSubmit={mode === "edit" ? (event) => event.preventDefault() : undefined}
        className="contents"
      >
        {mode === "create" ? (
          <input
            key={`${idPrefix}-items`}
            type="hidden"
            name="items"
            value={JSON.stringify(
              selected.map((item) => ({
                type: item.type,
                id: item.id,
                discount: item.discount,
              })),
            )}
          />
        ) : null}
        <input
          key={`${idPrefix}-collectionType`}
          type="hidden"
          name="collectionType"
          value={collectionType}
        />
        {mode === "create" ? (
          <div key={`${idPrefix}-payment-fields`} className="contents">
            <input type="hidden" name="paymentIntent" value={effectivePaymentIntent} />
            {paymentDraft ? (
              <>
                <input type="hidden" name="collectedMethod" value={paymentDraft.method} />
                <input type="hidden" name="collectedAmount" value={paymentDraft.amount} />
              </>
            ) : null}
          </div>
        ) : null}
        <input key={`${idPrefix}-gender`} type="hidden" name="gender" value={gender} />

        <BookingSection key={`${idPrefix}-patient`} title="Patient" className="order-1">
          <div className="flex flex-col gap-3" onBlur={onPatientSectionBlur}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${idPrefix}-patientName`}>Patient name</Label>
                <Input
                  id={`${idPrefix}-patientName`}
                  name="patientName"
                  required
                  maxLength={120}
                  autoComplete="name"
                  value={patientName}
                  onChange={(event) =>
                    setPatientName(event.target.value.slice(0, 120))
                  }
                  autoFocus={mode === "create"}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${idPrefix}-phone`}>Mobile number</Label>
                <Input
                  id={`${idPrefix}-phone`}
                  name="phone"
                  type="tel"
                  required
                  maxLength={14}
                  placeholder={BD_PHONE_HINT}
                  inputMode="numeric"
                  autoComplete="tel"
                  pattern="^(?:\+?880|0)?1[3-9]\d{8}$"
                  title={BD_PHONE_HINT}
                  value={phone}
                  onChange={(event) =>
                    setPhone(sanitizeBdPhoneInput(event.target.value))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${idPrefix}-age`}>
                  Age <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id={`${idPrefix}-age`}
                  name="age"
                  type="text"
                  inputMode="numeric"
                  min={0}
                  max={130}
                  maxLength={3}
                  value={age}
                  onChange={(event) =>
                    setAge(sanitizeAgeInput(event.target.value))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Gender</Label>
                <GenderRadioGroup
                  idPrefix={`${idPrefix}-gender`}
                  value={gender}
                  onValueChange={setGender}
                  required
                  labels={{ male: "Male", female: "Female", other: "Other" }}
                />
              </div>
            </div>
          </div>
        </BookingSection>

        {mode === "create" ? (
          catalog.length === 0 ? (
            <BookingSection
              key={`${idPrefix}-catalog-empty`}
              title="Tests & packages"
              className="order-3"
            >
              <p className="text-sm text-muted-foreground">
                Add active tests or packages before creating bookings.
              </p>
            </BookingSection>
          ) : (
            <CatalogItemCombobox
              key={`${idPrefix}-catalog`}
              id={`${idPrefix}-catalog`}
              items={catalog}
              selected={selected}
              onSelectedChange={setSelected}
              paymentDue={createNetRounded}
              paymentDraft={paymentDraft}
              onPaymentDraftChange={setPaymentDraft}
              sectionClassName="order-3"
            />
          )
        ) : null}

        <BookingSection key={`${idPrefix}-notes`} title="Notes" className="order-4">
          <Textarea
            id={`${idPrefix}-notes`}
            name="notes"
            rows={2}
            maxLength={500}
            placeholder="Optional"
            aria-label="Notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </BookingSection>

        <BookingSection key={`${idPrefix}-visit`} title="Visit" className="order-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label>Collection</Label>
              <RadioGroup
                value={collectionType}
                onValueChange={(value) => {
                  if (value === "IN_CENTER" || value === "HOME") {
                    setCollectionType(value);
                  }
                }}
                className="grid gap-2 sm:grid-cols-2"
              >
                <label
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                    "cursor-pointer",
                    collectionType === "IN_CENTER" && "border-primary bg-primary/5",
                  )}
                >
                  <RadioGroupItem value="IN_CENTER" />
                  <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  In center
                </label>
                <label
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                    "cursor-pointer",
                    collectionType === "HOME" && "border-primary bg-primary/5",
                  )}
                >
                  <RadioGroupItem value="HOME" />
                  <Home className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  Home collection
                </label>
              </RadioGroup>
            </div>

            {collectionType === "HOME" ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${idPrefix}-address`}>Collection address</Label>
                <Textarea
                  id={`${idPrefix}-address`}
                  name="address"
                  required
                  rows={2}
                  maxLength={300}
                  placeholder="House, road, area…"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              {collectionType === "IN_CENTER" && branches.length > 1 ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`${idPrefix}-branch`}>Branch</Label>
                  <Select
                    name="branchId"
                    value={branchId || null}
                    onValueChange={(value) => {
                      if (value) setBranchId(value);
                    }}
                    items={Object.fromEntries(branches.map((b) => [b.id, b.name]))}
                  >
                    <SelectTrigger id={`${idPrefix}-branch`} className="w-full">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : collectionType === "IN_CENTER" && branches.length === 1 ? (
                <input type="hidden" name="branchId" value={branches[0].id} />
              ) : null}

              <div className="flex flex-col gap-2">
                <Label htmlFor={`${idPrefix}-preferredDate`}>
                  Preferred date
                  {collectionType === "HOME" ? null : (
                    <span className="text-muted-foreground"> (optional)</span>
                  )}
                </Label>
                <Input
                  id={`${idPrefix}-preferredDate`}
                  name="preferredDate"
                  type="date"
                  min={mode === "create" ? todayDateInputValue() : undefined}
                  required={collectionType === "HOME"}
                  value={preferredDate}
                  onChange={(event) => setPreferredDate(event.target.value)}
                />
              </div>

              {collectionType === "HOME" ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`${idPrefix}-preferredTime`}>Preferred time</Label>
                  <Select
                    name="preferredTime"
                    required
                    value={preferredTime || null}
                    onValueChange={(value) => {
                      if (value) setPreferredTime(value);
                    }}
                    items={Object.fromEntries(
                      TIME_SLOT_VALUES.map((slot) => [slot, slot]),
                    )}
                  >
                    <SelectTrigger id={`${idPrefix}-preferredTime`} className="w-full">
                      <SelectValue placeholder="Select time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOT_VALUES.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
          </div>
        </BookingSection>

        {mode === "create" ? (
          <div
            key={`${idPrefix}-create-actions`}
            className="order-6 flex flex-wrap items-center gap-2"
          >
            <Button
              type="submit"
              disabled={
                createPending ||
                !patientName.trim() ||
                !isPlausibleBdPhone(phone) ||
                !gender ||
                selected.length === 0 ||
                catalog.length === 0 ||
                (collectionType === "HOME" &&
                  (!address.trim() || !preferredDate || !preferredTime)) ||
                (effectivePaymentIntent === "collect" &&
                  (!paymentDraft ||
                    !paymentDraft.amount ||
                    Number(paymentDraft.amount) <= 0))
              }
            >
              {createPending ? "Booking…" : "Create booking"}
            </Button>
          </div>
        ) : null}
      </form>

      {mode === "edit" && savePending ? (
        <p
          key={`${idPrefix}-saving`}
          className="order-6 text-xs text-muted-foreground"
          aria-live="polite"
        >
          Saving…
        </p>
      ) : null}

      {invoice != null ? (
        <div key={`${idPrefix}-invoice`} className="contents">
          {invoice}
        </div>
      ) : null}

      {mode === "edit" ? (
        <Dialog
          key={`${idPrefix}-patient-confirm`}
          open={patientConfirmOpen}
          onOpenChange={onPatientConfirmOpenChange}
          disablePointerDismissal
        >
          <DialogContent showCloseButton={false} className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Update patient details?</DialogTitle>
              <DialogDescription>
                This changes the name, phone, age, or gender on this booking.
                Reports and the patient portal use these details.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={savePending}
                onClick={discardPatientChanges}
              >
                Keep original
              </Button>
              <Button
                type="button"
                disabled={savePending || !pendingPatient}
                onClick={confirmPatientUpdate}
              >
                {savePending ? "Updating…" : "Update patient"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
