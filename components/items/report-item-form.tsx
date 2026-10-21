"use client";

import { RotateCcw, X, ArrowLeft, LogIn, MapPin, Save, Send, Upload } from "lucide-react";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { IconLink } from "@/components/ui/icon-link";
import { useSessionQuery, useReportItemMutation, useEditItemMutation } from "@/store/api/auth-api";
import { itemsApi, useGetCategoriesQuery } from "@/store/api/items-api";
import { useAppDispatch } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Item } from "@/lib/items";
import { validatePhotos, validateReport } from "@/lib/report-item";

function PhotoPreview({ file, remove }: { file: File; remove: () => void }) {
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (image.current) image.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <div className="report-photo">
      {/* Local object URLs do not need the remote image optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={image} alt={file.name} />
      <Button
        variant="secondary"
        onClick={remove}
        aria-label={`Remove ${file.name}`}
        iconLabel={`Remove ${file.name}`}
      >
        <X size={18} />
      </Button>
    </div>
  );
}

export function ReportItemForm({
  initialItem,
  onSaved,
  onCancel,
}: {
  initialItem?: Item;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const session = useSessionQuery();
  const categories = useGetCategoriesQuery(undefined, { skip: !session.data?.user });
  const [publish, creation] = useReportItemMutation();
  const [update, editing] = useEditItemMutation();
  const isLoading = creation.isLoading || editing.isLoading;
  const [photoMode, setPhotoMode] = useState("keep");
  const [type, setType] = useState<"LOST" | "FOUND">(initialItem?.type ?? "LOST");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [coordinates, setCoordinates] = useState({
    lat: String(initialItem?.locationLat ?? ""),
    lng: String(initialItem?.locationLng ?? ""),
  });
  const [locating, setLocating] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;
    setError("");
    const values = new FormData(event.currentTarget);
    const text = (key: string) => String(values.get(key) || "").trim();
    const item = {
      type,
      name: text("name"),
      categoryId: text("categoryId"),
      description: text("description") || (initialItem ? "" : null),
      brand: text("brand") || (initialItem ? "" : null),
      color: text("color") || (initialItem ? "" : null),
      locationLat: coordinates.lat === "" ? null : Number(coordinates.lat),
      locationLng: coordinates.lng === "" ? null : Number(coordinates.lng),
      dateTime: text("dateTime") ? new Date(text("dateTime")).toISOString() : null,
      ...(type === "LOST"
        ? { rewardAmount: text("rewardAmount") ? Number(text("rewardAmount")) : null }
        : { storageLocation: text("storageLocation") || (initialItem ? "" : null) }),
    };
    if (initialItem && photoMode === "replace" && files.length === 0) {
      setError("Choose replacement photos, or select remove all.");
      return;
    }
    const invalid = validateReport(item) || validatePhotos(files);
    if (invalid) {
      setError(invalid);
      return;
    }
    const body = new FormData();
    if (initialItem) body.set("id", initialItem.id);
    body.set(
      "item",
      new Blob(
        [
          JSON.stringify({
            ...item,
            ...(initialItem && photoMode !== "keep" ? { replaceAllImages: true } : {}),
          }),
        ],
        { type: "application/json" },
      ),
    );
    if (!initialItem || photoMode === "replace")
      files.forEach((file) => body.append("files", file));
    try {
      const result = await (initialItem ? update(body) : publish(body)).unwrap();
      dispatch(itemsApi.util.resetApiState());
      if (onSaved) {
        onSaved();
        return;
      }
      router.push(`/items/${encodeURIComponent(result.data.id)}`);
    } catch (failure) {
      const status =
        failure && typeof failure === "object" && "status" in failure ? failure.status : null;
      const message =
        failure &&
        typeof failure === "object" &&
        "data" in failure &&
        failure.data &&
        typeof failure.data === "object" &&
        "message" in failure.data
          ? String(failure.data.message)
          : null;
      setError(
        status === 401
          ? "Your session expired. Sign in again before publishing. Your form remains here."
          : message ||
              "Could not confirm publication. Check Browse items before trying again; your report may have been saved.",
      );
    }
  }

  function locate() {
    if (!navigator.geolocation) {
      setError("Location is unavailable. Enter coordinates manually.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: String(position.coords.latitude),
          lng: String(position.coords.longitude),
        });
        setLocating(false);
      },
      () => {
        setError("Could not get your location. Enter coordinates manually.");
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }

  if (session.isLoading)
    return (
      <div className="container page-stack" role="status">
        Checking your session…
      </div>
    );
  if (!session.data?.user)
    return (
      <section className="container page-stack">
        <h1>{initialItem ? "Edit report" : "Report an item"}</h1>
        {session.isError && !("status" in session.error && session.error.status === 401) ? (
          <>
            <p>We could not check your session.</p>
            <Button onClick={() => session.refetch()} iconLabel="Try again">
              <RotateCcw size={18} aria-hidden="true" />
            </Button>
          </>
        ) : (
          <>
            <p>Sign in to report a lost or found item.</p>
            <IconLink label="Sign in" href="/login">
              <LogIn size={18} />
            </IconLink>
          </>
        )}
      </section>
    );

  return (
    <section className="container page-stack report-page">
      <div className="hero">
        <p className="eyebrow">Bring belongings home</p>
        <h1>{initialItem ? "Edit report" : "Report an item"}</h1>
        <p className="muted">
          Share the details that will help someone recognize it. Fields marked * are required.
        </p>
      </div>
      <form onSubmit={submit} className="section-stack">
        <fieldset disabled={isLoading} className="report-fields section-stack">
          <fieldset className="report-type" disabled={!!initialItem}>
            <legend>What happened? *</legend>
            {(["LOST", "FOUND"] as const).map((value) => (
              <label key={value}>
                <input
                  type="radio"
                  name="type"
                  value={value}
                  checked={type === value}
                  onChange={() => setType(value)}
                />
                I {value === "LOST" ? "lost" : "found"} an item
              </label>
            ))}
          </fieldset>
          <Input
            label="Item name *"
            name="name"
            defaultValue={initialItem?.name}
            required
            maxLength={255}
            placeholder="e.g. Black leather wallet"
          />
          <div className="field">
            <label htmlFor="report-category">Category *</label>
            <select
              className="ui-input"
              id="report-category"
              name="categoryId"
              required
              disabled={categories.isFetching || categories.isError}
              defaultValue={initialItem?.category?.id ?? ""}
            >
              <option value="">
                {categories.isFetching ? "Loading categories…" : "Select a category"}
              </option>
              {categories.data?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {categories.isError && (
              <>
                <p role="alert">Categories could not be loaded.</p>
                <Button
                  variant="secondary"
                  onClick={() => categories.refetch()}
                  iconLabel="Retry categories"
                >
                  <RotateCcw size={18} aria-hidden="true" />
                </Button>
              </>
            )}
          </div>
          <div className="field">
            <label htmlFor="report-description">Description</label>
            <textarea
              className="ui-input"
              id="report-description"
              name="description"
              defaultValue={initialItem?.description ?? ""}
              rows={5}
              maxLength={10000}
              placeholder="Add recognizable details. Keep private information out of your report."
            />
          </div>
          <div className="report-grid">
            <Input
              label="Brand"
              name="brand"
              placeholder="e.g. Apple, Samsung or Nike"
              defaultValue={initialItem?.brand ?? ""}
              maxLength={100}
            />
            <Input
              label="Color"
              name="color"
              placeholder="e.g. Black, blue or silver"
              defaultValue={initialItem?.color ?? ""}
              maxLength={50}
            />
          </div>
          <div className="section-stack">
            <h2>Photos</h2>
            {initialItem && (
              <div className="field">
                <label htmlFor="photo-mode">Current photos ({initialItem.photoUrls.length})</label>
                <select
                  id="photo-mode"
                  className="ui-input"
                  value={photoMode}
                  onChange={(event) => {
                    setPhotoMode(event.target.value);
                    setFiles([]);
                  }}
                >
                  <option value="keep">Keep current photos</option>
                  <option value="replace">Replace all photos</option>
                  <option value="remove">Remove all photos</option>
                </select>
                {photoMode === "keep" && (
                  <div className="report-photos">
                    {initialItem.photoUrls.map((url, index) => (
                      <div className="report-photo" key={index}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Current photo ${index + 1}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Input
              label="Add photos"
              disabled={!!initialItem && photoMode !== "replace"}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hint="Up to 10 JPG, PNG or WebP photos, 5 MB each."
              onChange={(event) => {
                const next = [...files, ...Array.from(event.target.files || [])];
                const invalid = validatePhotos(next);
                if (invalid) setError(invalid);
                else {
                  setFiles(next);
                  setError("");
                }
                event.target.value = "";
              }}
            />
            <div className="report-photos">
              {files.map((file, index) => (
                <PhotoPreview
                  key={`${file.name}-${file.lastModified}-${index}`}
                  file={file}
                  remove={() => setFiles((current) => current.filter((_, i) => i !== index))}
                />
              ))}
            </div>
          </div>
          <h2>Where and when</h2>
          <Input
            label={type === "LOST" ? "When did you last see it?" : "When did you find it?"}
            type="datetime-local"
            name="dateTime"
            defaultValue={
              initialItem?.dateTime
                ? (() => {
                    const date = new Date(initialItem.dateTime);
                    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                      .toISOString()
                      .slice(0, 16);
                  })()
                : ""
            }
            hint="Select a date and time using the picker. Use your local date and time."
          />
          {initialItem && (
            <p className="muted">
              Leaving date, coordinates or reward blank keeps the saved value. Use 0 to remove a
              reward.
            </p>
          )}
          <p className="muted">
            Optional coordinates are public. Only share a location you are comfortable publishing.
          </p>
          <Button
            variant="secondary"
            onClick={locate}
            loading={locating}
            iconLabel="Use my current location"
          >
            <MapPin size={18} />
          </Button>
          <div className="report-grid">
            <Input
              label="Latitude"
              placeholder="e.g. 11.5564"
              type="number"
              min={-90}
              max={90}
              step="any"
              value={coordinates.lat}
              onChange={(e) => setCoordinates({ ...coordinates, lat: e.target.value })}
            />
            <Input
              label="Longitude"
              placeholder="e.g. 104.9282"
              type="number"
              min={-180}
              max={180}
              step="any"
              value={coordinates.lng}
              onChange={(e) => setCoordinates({ ...coordinates, lng: e.target.value })}
            />
          </div>
          {type === "LOST" ? (
            <Input
              label="Reward amount (optional)"
              name="rewardAmount"
              placeholder="e.g. 25.00"
              defaultValue={initialItem?.rewardAmount ?? ""}
              type="number"
              min={0}
              step="0.01"
            />
          ) : (
            <Input
              label="Where is the item being kept?"
              name="storageLocation"
              defaultValue={initialItem?.storageLocation ?? ""}
              maxLength={255}
              placeholder="e.g. Library reception desk"
            />
          )}
        </fieldset>
        {error && (
          <div role="alert" className="field-error">
            {error}{" "}
            <Link href="/login" target="_blank" rel="noopener">
              Open sign in
            </Link>
          </div>
        )}
        {isLoading && (
          <div role="status" className="section-stack">
            <span>
              <Upload size={18} /> Uploading photos and publishing your report…
            </span>
            <progress aria-label="Publishing report" />
          </div>
        )}
        <div className="row">
          <Button
            type="submit"
            iconLabel={initialItem ? "Save changes" : undefined}
            loading={isLoading}
            disabled={!categories.data?.length || locating}
          >
            {initialItem ? (
              <Save size={18} aria-hidden="true" />
            ) : (
              <Send size={18} aria-hidden="true" />
            )}
            {!initialItem && "Publish report"}
          </Button>
          {onCancel ? (
            <Button
              variant="secondary"
              disabled={isLoading}
              onClick={onCancel}
              iconLabel="Cancel editing"
            >
              <X size={18} aria-hidden="true" />
            </Button>
          ) : (
            <IconLink label="Back to items" href="/items">
              <ArrowLeft size={18} aria-hidden="true" />
            </IconLink>
          )}
        </div>
      </form>
    </section>
  );
}
