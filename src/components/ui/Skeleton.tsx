"use client";

import React from "react";

/* ------------------------------------------------------------------ */
/*  Dashboard Skeleton Loader                                          */
/*  Shows pulsing placeholder cards while data loads                   */
/*  Uses existing .skeleton CSS classes from globals.css                */
/* ------------------------------------------------------------------ */

/** Single skeleton card with a title bar and 3 text rows */
function SkeletonCard() {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="skeleton skeleton-text short" style={{ marginBottom: 16 }} />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text short" />
    </div>
  );
}

/** KPI skeleton — single stat card */
function SkeletonKPI() {
  return (
    <div className="skeleton" style={{ borderRadius: 12, padding: "20px 16px", textAlign: "center" }}>
      <div style={{ height: 28, width: "50%", margin: "0 auto 8px", background: "var(--surface-3)", borderRadius: 4 }} />
      <div style={{ height: 12, width: "70%", margin: "0 auto", background: "var(--surface-3)", borderRadius: 4 }} />
    </div>
  );
}

/** Full dashboard skeleton layout */
export function DashboardSkeleton() {
  return (
    <div style={{ animation: "fade-in 0.3s ease" }}>
      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <SkeletonKPI />
        <SkeletonKPI />
        <SkeletonKPI />
        <SkeletonKPI />
      </div>
      {/* Analytics grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

/** Viewer dashboard skeleton */
export function ViewerDashboardSkeleton() {
  return (
    <div style={{ animation: "fade-in 0.3s ease" }}>
      {/* Date picker placeholder */}
      <div className="skeleton" style={{ height: 36, width: 320, borderRadius: 8, marginBottom: 20 }} />
      {/* KPI strip */}
      <div className="viewer-kpi-strip" style={{ marginBottom: 24 }}>
        <SkeletonKPI />
        <SkeletonKPI />
        <SkeletonKPI />
        <SkeletonKPI />
      </div>
      {/* Cards grid */}
      <div className="viewer-analytics-grid">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
