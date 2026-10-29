"use client";
import { useState } from "react";
import { useIndexItemMutation } from "@/store/api/community-api";
import { requestError } from "@/lib/community";
import { Button } from "@/components/ui/button";

export function IndexItem({ id, hasPhotos }: { id: string; hasPhotos: boolean }) {
  const [index, state] = useIndexItemMutation();
  const [message, setMessage] = useState("");
  async function run(photos: boolean) {
    setMessage("");
    try {
      await index({ id, photos }).unwrap();
      setMessage(
        photos ? "Photos are ready for image search." : "Report is ready for smart search.",
      );
    } catch (error) {
      setMessage(requestError(error));
    }
  }
  return (
    <details className="search-tools">
      <summary>Search visibility</summary>
      <div className="section-stack">
        <p className="muted">
          Refresh your report’s search index after changing its details or photos.
        </p>
        <div className="row">
          <Button
            size="sm"
            variant="secondary"
            loading={state.isLoading}
            onClick={() => run(false)}
          >
            Refresh description index
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={!hasPhotos}
            loading={state.isLoading}
            onClick={() => run(true)}
          >
            Refresh photo index
          </Button>
        </div>
        {message && <p role="status">{message}</p>}
      </div>
    </details>
  );
}
