"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionQuery, useLogoutMutation, authApi } from "@/store/api/auth-api";
import { useAppDispatch } from "@/store/hooks";
import { itemsApi } from "@/store/api/items-api";
import { resetFilters } from "@/store/slices/filters-slice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function Account() {
  const session = useSessionQuery(undefined, { pollingInterval: 60000, refetchOnMountOrArgChange: true });
  const [logout, logoutState] = useLogoutMutation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [logoutError, setLogoutError] = useState("");
  const signedOut = session.error && "status" in session.error && session.error.status === 401;
  useEffect(() => { if (signedOut) router.replace("/login"); }, [signedOut, router]);
  async function signOut() {
    setLogoutError("");
    try { await logout().unwrap(); }
    catch (error) {
      if (!(error && typeof error === "object" && "status" in error && error.status === 401)) { setLogoutError("We couldn’t sign you out. Please try again."); return; }
    }
    dispatch(authApi.util.resetApiState()); dispatch(itemsApi.util.resetApiState()); dispatch(resetFilters());
    router.replace("/login"); router.refresh();
  }
  if (session.isLoading || signedOut) return <div className="container page-stack" role="status">Checking your session…</div>;
  if (session.isError) return <div className="container page-stack"><Card className="section-stack"><h1>Unable to load your account</h1><p role="alert">Please try again when the account service is available.</p><Button onClick={() => session.refetch()}>Try again</Button></Card></div>;
  const user = session.data?.user;
  if (!user) return <div className="container page-stack" role="status">Loading account…</div>;
  return <div className="container page-stack"><header className="hero"><p className="eyebrow">Your account</p><h1>Hello, {user.name}.</h1><p className="muted">You’re part of the Lost & Found community.</p></header><Card className="section-stack"><h2>Account details</h2><dl className="item-facts"><div><dt>Name</dt><dd>{user.name}</dd></div><div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Phone</dt><dd>{user.phone || "Not provided"}</dd></div></dl><p className="muted">Signing out ends your sessions on all devices.</p>{logoutError && <p role="alert" className="field-error">{logoutError}</p>}<div><Button variant="secondary" loading={logoutState.isLoading} onClick={signOut}>Sign out of all devices</Button></div></Card></div>;
}
