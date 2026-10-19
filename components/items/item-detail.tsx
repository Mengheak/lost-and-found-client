"use client";

import { useState } from "react";
import { ArrowLeft, MapPin, CalendarDays, RotateCcw, Expand } from "lucide-react";
import { useGetItemQuery } from "@/store/api/items-api";
import { Button } from "@/components/ui/button";
import { IconLink } from "@/components/ui/icon-link";
import { formatItemDate, itemLocation } from "@/lib/items";
import { ItemPhoto } from "./item-photo";
import { PostHeader } from "./post-header";
import { ImageModal } from "../ui/image-modal";

export function ItemDetail({ id }: { id: string }) {
  const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const {
    data: item,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetItemQuery(id, { skip: !validId, pollingInterval: 300000 });
  const [photoIndex, setPhotoIndex] = useState(0);
  const [openImageModal, setOpenImageModal] = useState(false);
  const notFound = !validId || (error && "status" in error && error.status === 404);
  return (
    <div className="container page-stack community-feed">
      <div className="row">
        <IconLink label="Back to posts" href="/items">
          <ArrowLeft size={18} aria-hidden="true" />
        </IconLink>
        <p className="eyebrow">Community post</p>
      </div>
      {isLoading ? (
        <div role="status" className="browse-message">
          Loading post…
        </div>
      ) : notFound ? (
        <div className="browse-message">
          <h1>Post not found</h1>
          <p className="muted">This report may have been removed or the link may be incorrect.</p>
        </div>
      ) : isError ? (
        <div className="browse-message" role="alert">
          <h1>Unable to load this post</h1>
          <p className="muted">Please check your connection and try again.</p>
          <Button onClick={() => refetch()} iconLabel="Try again">
            <RotateCcw size={18} aria-hidden="true" />
          </Button>
        </div>
      ) : (
        item && (
          <article className="community-post post-detail">
            <PostHeader item={item} />
            <div className="post-copy">
              <h1>{item.name}</h1>
              <p className="post-story">
                {item.description || "No additional details shared yet."}
              </p>
            </div>
            {!!item.photoUrls?.length && (
              <section className="post-gallery" aria-label="Post photos">
                {openImageModal && (
                  <ImageModal
                    key={photoIndex}
                    initialIndex={photoIndex}
                    images={item.photoUrls}
                    onClose={() => setOpenImageModal(false)}
                    open
                  />
                )}
                <button
                  type="button"
                  className="post-media post-photo-button"
                  onClick={() => setOpenImageModal(true)}
                  aria-label={`Enlarge photo ${photoIndex + 1} of ${item.photoUrls.length}`}
                >
                  <ItemPhoto
                    src={item.photoUrls[photoIndex] || item.photoUrls[0]}
                    alt={item.name}
                  />
                  <span className="post-photo-count">
                    <Expand size={16} aria-hidden="true" />
                    {photoIndex + 1} / {item.photoUrls.length}
                  </span>
                </button>
                {item.photoUrls.length > 1 && (
                  <div className="photo-picker" role="group" aria-label="Choose a photo">
                    {item.photoUrls.map((src, index) => (
                      <button
                        type="button"
                        key={index}
                        className="photo-choice"
                        aria-label={`View photo ${index + 1}`}
                        aria-pressed={photoIndex === index}
                        onClick={() => setPhotoIndex(index)}
                      >
                        <ItemPhoto src={src} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}
            <section className="post-information" aria-label="Report details">
              <div className="post-footer">
                <div className="section-stack">
                  <p className="item-meta">
                    <MapPin size={18} aria-hidden="true" />
                    {itemLocation(item)}
                  </p>
                  <p className="item-meta">
                    <CalendarDays size={18} aria-hidden="true" />
                    {item.type === "LOST" ? "Lost" : "Found"}: {formatItemDate(item.dateTime)}
                  </p>
                </div>
                {item.locationLat != null && item.locationLng != null && (
                  <a
                    className="ui-button ui-button--secondary icon-action"
                    aria-label="View location on map"
                    title="View location on map"
                    href={`https://www.openstreetmap.org/?mlat=${item.locationLat}&mlon=${item.locationLng}#map=16/${item.locationLat}/${item.locationLng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin size={18} aria-hidden="true" />
                  </a>
                )}
              </div>
              <dl className="post-facts">
                {item.category && (
                  <div>
                    <dt>Category</dt>
                    <dd>{item.category.name}</dd>
                  </div>
                )}
                {item.brand && (
                  <div>
                    <dt>Brand</dt>
                    <dd>{item.brand}</dd>
                  </div>
                )}
                {item.color && (
                  <div>
                    <dt>Color</dt>
                    <dd>{item.color}</dd>
                  </div>
                )}
                {item.returnedAt && (
                  <div>
                    <dt>Returned</dt>
                    <dd>{formatItemDate(item.returnedAt)}</dd>
                  </div>
                )}
              </dl>
            </section>
          </article>
        )
      )}
    </div>
  );
}
