"use client";

import { useState } from "react";
import Link from "next/link";
import { Key, Warning, Trash, ShieldCheck, ArrowsClockwise } from "@phosphor-icons/react/dist/ssr";
import { unclaimListing, updatePassword, deleteAccount } from "../actions";

interface SettingsClientProps {
  userEmail: string;
  listings: Array<{
    slug: string;
    name: string;
    subscription_tier: string;
  }>;
}

export function SettingsClient({ userEmail, listings }: SettingsClientProps) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [unclaimSlug, setUnclaimSlug] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {/* Account Info */}
      <div className="bg-bg/50 rounded-2xl border border-border p-6">
        <h2 className="font-heading text-lg font-semibold text-brand-primary mb-4">
          Account
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Email</label>
            <p className="text-sm text-brand-primary">{userEmail}</p>
          </div>

          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:text-brand-primary transition-colors"
            >
              <Key weight="bold" className="w-4 h-4" />
              Change Password
            </button>
          ) : (
            <form action={updatePassword} className="space-y-3 pt-2">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5" htmlFor="newPassword">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="rounded-full bg-brand-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-primary/90 transition-all"
                >
                  Update Password
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="text-sm text-text-muted hover:text-brand-primary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Subscription Management */}
      {listings.length > 0 && (
        <div className="bg-bg/50 rounded-2xl border border-border p-6">
          <h2 className="font-heading text-lg font-semibold text-brand-primary mb-4">
            My Listings
          </h2>
          <div className="space-y-4">
            {listings.map((listing) => (
              <div key={listing.slug} className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-semibold text-brand-primary">{listing.name}</p>
                  <p className="text-xs text-text-muted capitalize">{listing.subscription_tier} plan</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/claim/${listing.slug}/plans`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent hover:text-brand-primary transition-colors"
                  >
                    <ArrowsClockwise weight="bold" className="w-3.5 h-3.5" />
                    Change Plan
                  </Link>
                  {unclaimSlug === listing.slug ? (
                    <div className="flex items-center gap-2">
                      <form action={unclaimListing}>
                        <input type="hidden" name="slug" value={listing.slug} />
                        <button
                          type="submit"
                          className="text-xs font-bold text-[#C2185B] hover:text-[#AD1457] transition-colors"
                        >
                          Confirm
                        </button>
                      </form>
                      <button
                        onClick={() => setUnclaimSlug(null)}
                        className="text-xs text-text-muted hover:text-brand-primary transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setUnclaimSlug(listing.slug)}
                      className="text-xs font-semibold text-text-muted hover:text-[#C2185B] transition-colors"
                    >
                      Unclaim
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-4">
            Unclaiming removes you as the owner. The listing stays in the directory but you lose control of it.
          </p>
        </div>
      )}

      {/* Danger Zone */}
      <div className="rounded-2xl border-2 border-[#F48FB1] p-6">
        <div className="flex items-center gap-2 mb-3">
          <Warning weight="fill" className="w-5 h-5 text-[#C2185B]" />
          <h2 className="font-heading text-lg font-semibold text-[#C2185B]">
            Danger Zone
          </h2>
        </div>

        {!showDeleteConfirm ? (
          <>
            <p className="text-sm text-text-muted mb-4">
              Permanently delete your account and unclaim all listings. This cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#C2185B] px-5 py-2.5 text-sm font-bold text-[#C2185B] hover:bg-[#FCE4EC] transition-all"
            >
              <Trash weight="bold" className="w-4 h-4" />
              Delete Account
            </button>
          </>
        ) : (
          <form action={deleteAccount} className="space-y-3">
            <p className="text-sm text-[#C2185B] font-medium">
              Type DELETE to confirm account deletion:
            </p>
            <input
              type="text"
              name="confirmation"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              className="w-full rounded-xl border border-[#F48FB1] bg-white px-4 py-3 text-sm shadow-sm focus:border-[#C2185B] focus:ring-1 focus:ring-[#C2185B] outline-none"
              placeholder="Type DELETE"
              required
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={deleteText !== "DELETE"}
                className="rounded-full bg-[#C2185B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#AD1457] transition-all disabled:opacity-40 disabled:hover:bg-[#C2185B]"
              >
                Delete My Account
              </button>
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setDeleteText(""); }}
                className="text-sm text-text-muted hover:text-brand-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
