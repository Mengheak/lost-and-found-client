"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Save, Trash2, Undo2 } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import { validateProfile } from "@/lib/profile";
import { validatePhotos } from "@/lib/report-item";
import { useUpdateProfileMutation } from "@/store/api/auth-api";
import { itemsApi } from "@/store/api/items-api";
import { useAppDispatch } from "@/store/hooks";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EditProfileForm({
  user,
  onSaved,
  onCancel,
}: {
  user: AuthUser;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [save, { isLoading }] = useUpdateProfileMutation();
  const dispatch = useAppDispatch();
  const [photo, setPhoto] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [error, setError] = useState("");
  const preview = useRef<HTMLImageElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    if (preview.current) preview.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function resetPhoto() {
    setPhoto(null);
    setRemovePhoto(false);
    if (picker.current) picker.current.value = "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;
    const values = new FormData(event.currentTarget);
    const profile = {
      name: String(values.get("name") || "").trim(),
      phone: String(values.get("phone") || "").trim(),
      removePhoto,
    };
    const invalid = validateProfile(profile) || validatePhotos(photo ? [photo] : []);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError("");
    const body = new FormData();
    body.set("profile", new Blob([JSON.stringify(profile)], { type: "application/json" }));
    if (photo) body.set("avatar", photo);
    try {
      await save(body).unwrap();
      dispatch(itemsApi.util.resetApiState());
      onSaved();
    } catch (failure) {
      const status =
        failure && typeof failure === "object" && "status" in failure ? failure.status : null;
      setError(
        status === 401
          ? "Your session expired. Sign in again before saving."
          : "Could not confirm your changes. Check your account before retrying. Your input has been kept.",
      );
    }
  }

  return (
    <form className="section-stack" onSubmit={submit}>
      <h2>Edit profile</h2>
      <fieldset className="report-fields section-stack" disabled={isLoading}>
        <Input
          label="Name"
          name="name"
          defaultValue={user.name}
          required
          maxLength={255}
          autoComplete="name"
        />
        <Input label="Email" value={user.email} readOnly hint="Email cannot be changed here." />
        <Input
          label="Phone (optional)"
          name="phone"
          type="tel"
          defaultValue={user.phone ?? ""}
          maxLength={50}
          autoComplete="tel"
          hint="Leave blank to remove your phone number."
        />
        <div className="section-stack">
          <h3>Profile photo</h3>
          {photo ? (
            // Browser-generated preview URLs are released when replaced or unmounted.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={preview}
              alt="New profile photo preview"
              width={96}
              height={96}
              style={{ borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <Avatar src={removePhoto ? null : user.profilePhotoUrl} name={user.name} size="lg" />
          )}
          <div className="field">
            <label htmlFor="profile-photo">Upload a photo</label>
            <input
              ref={picker}
              className="ui-input"
              id="profile-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-describedby="profile-photo-hint"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const invalid = validatePhotos([file]);
                if (invalid) {
                  setError(invalid);
                  event.target.value = "";
                  return;
                }
                setError("");
                setPhoto(file);
                setRemovePhoto(false);
              }}
            />
            <p id="profile-photo-hint" className="muted">
              JPG, PNG or WebP, up to 5 MB. Changes apply when you save.
            </p>
          </div>
          <div className="row">
            {(user.profilePhotoUrl || photo) && !removePhoto && (
              <Button
                variant="secondary"
                onClick={() => {
                  resetPhoto();
                  setRemovePhoto(true);
                }}
              >
                <Trash2 size={18} />
                Remove photo
              </Button>
            )}
            {(photo || removePhoto) && (
              <Button variant="ghost" onClick={resetPhoto}>
                <Undo2 size={18} />
                Undo photo change
              </Button>
            )}
          </div>
          {removePhoto && <p role="status">Your profile photo will be removed when you save.</p>}
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      {isLoading && <p role="status">Saving your profile…</p>}
      <div className="row">
        <Button type="submit" loading={isLoading}>
          <Save size={18} />
          Save changes
        </Button>
        <Button variant="secondary" disabled={isLoading} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
