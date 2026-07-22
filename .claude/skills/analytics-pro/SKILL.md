---
name: analytics-pro
description: "Expert analytics for digital products: GA4 setup, Facebook Analytics, conversion funnels, cohort analysis, attribution modeling, retention metrics, and data-driven decision making."
---

# Analytics Pro — Data-Driven Insights

Data without interpretation is noise. Interpretation without data is guessing. This skill bridges that gap.

Analytics Pro covers the metrics that actually matter for growth: conversion, retention, attribution, and customer behavior.

---

## Google Analytics 4 (GA4) Fundamentals

### Why GA4 Changed Everything
- **Event-based** (not session-based) — Tracks actions, not sessions
- **Cross-platform** — Web + app + offline in one view
- **Privacy-first** — Works with limited third-party data
- **Predictive** — Built-in ML for churn prediction, purchase prediction

### Critical GA4 Setup

#### 1. Event Configuration
GA4 tracks 4 automatic events. Custom events track everything else.

**Essential Custom Events to Track:**
- `view_content` — Page viewed
- `add_to_cart` — Product added
- `purchase` — Transaction completed
- `sign_up` — Account created
- `video_complete` — Video watched
- `form_submit` — Form submitted
- `checkout_error` — Abandoned checkout

**Event Parameters** — Attach data to events:
```
Event: purchase
Parameters:
  - value: $99.99
  - currency: USD
  - item_count: 3
  - user_segment: premium
```

#### 2. User ID Tracking
Enable cross-device tracking:
- Identify logged-in users
- Track same person across devices
- See complete customer journey

#### 3. Audience Building
Create audiences based on:
- Purchase history
- Page behavior
- Time since last visit
- Predicted churn probability

Use for remarketing, email segmentation, product experiments.

### GA4 Reports That Matter

**1. Acquisition Report**
- Where do users come from?
- Which channels cost most per acquisition?
- Which channels bring best-quality users?

**Optimize:** Double down on channels with highest LTV, not highest volume.

**2. Engagement Report**
- Session duration
- Pages per session
- Event count
- Bounce rate

**Optimize:** Longer engagement = higher conversion likelihood.

**3. Retention Report**
- % of users returning after Day 1, 7, 30
- Cohort retention (groups by acquisition week)
- Churn indicators

**Optimize:** Day 1-7 retention is your #1 growth lever.

**4. Conversion Funnel Report**
- Step-by-step drop-off
- Where users abandon
- Conversion rate per step

**Optimize:** Fix the highest drop-off step first (usually step 2-3).

---

## Facebook Analytics

### Pixel Setup
The Facebook Pixel tracks:
- Page views
- Add to cart
- Purchases
- Custom events

### Core Metrics
- **Cost per Result (CPR)** — How much to get one conversion
- **ROAS (Return on Ad Spend)** — Revenue generated per $1 spent
- **Frequency** — How many times user sees your ad
- **CTR (Click-Through Rate)** — % who click

### Optimization Targets
- ROAS target: 3.0 minimum for profitable ads
- Frequency: Keep under 4 (ad fatigue kills performance)
- CPR: Track weekly, kill campaigns above 2x baseline

### Attribution in Facebook
Facebook uses:
- **Last-click** (user's last interaction before conversion)
- **First-touch** (first interaction)
- **Multi-touch** (values across the journey)

**Reality:** Don't trust it 100%. Use GA4 for truth.

---

## Funnel Analysis Framework

A funnel is a series of steps toward a goal. Analyzing it reveals where you leak money.

### The Universal Funnel
```
Awareness (Ad spend)
    ↓
Interest (Click through)
    ↓
Consideration (View product)
    ↓
Purchase (Checkout)
    ↓
Retention (Return purchase)
```

### Conversion Rate Analysis

**Formula:** (Completed step ÷ Started step) × 100

Example:
- 10,000 visits
- 5,000 view product (50% → product page)
- 1,000 add to cart (20% → cart)
- 200 purchase (20% → conversion)

**Overall conversion:** 2% (200 ÷ 10,000)

### Drop-Off Optimization
Biggest wins come from:
1. **Identify the largest drop** (where most users leave)
2. **Find the barrier** (What stops them? Friction? Trust? Price?)
3. **Remove friction** (Simplify, reduce fields, auto-fill, testimonials)
4. **Measure improvement** (5% lift on a 50% drop is 2.5% overall gain)

**Example:** If cart → purchase drops 80%, focus on checkout. Reduce friction there first.

---

## Cohort Analysis

**Cohort = Group of users acquired in same period**

### Retention Cohort Example
```
Week Acquired | Week 1 | Week 2 | Week 3 | Week 4
Week 1        | 100%   | 45%    | 28%    | 18%
Week 2        | 100%   | 42%    | 26%    | 
Week 3        | 100%   | 44%    | 
Week 4        | 100%   |
```

**Reading:** Week 1 cohort retained 45% by week 2. Week 3 cohort retained 44%.

**Action:** If retention is flat, product isn't improving. If it's declining, acquisition method is worse. If improving, your onboarding got better.

### Segment Cohorts
- **By acquisition channel** — Which channel brings sticky users?
- **By pricing tier** — Do expensive users stay longer?
- **By feature adoption** — Users who enable feature X have 60% higher retention

---

## Attribution Modeling

**Question:** Which touchpoint deserves credit for the conversion?

### Attribution Models
- **Last-click** — Gives credit to final step (usually paid)
- **First-touch** — Gives credit to awareness (usually organic)
- **Linear** — Equal credit to all touches
- **Time-decay** — More credit to recent touches
- **Position-based** — 40/40/20 to first, last, middle

### Reality Check
- **GA4 is conservative** (more credit to organic)
- **Facebook is aggressive** (more credit to their ads)
- **Truth is in the middle**

### Use Multi-Touch Attribution
Track the full path:
1. User sees ad (Facebook)
2. Clicks to site (Facebook)
3. Reads blog post (Organic)
4. Signs up (Newsletter)
5. Purchases (Email)

Facebook wants credit for #1-2. Organic wants credit for #3. Newsletter wants #4.

**Better approach:** Track all touches. Assign partial credit. Don't fight over pennies.

---

## Retention Metrics

### Day 1 (D1) Retention
% of users who return on day 1 after first visit.

- **Good:** 25-40%
- **Great:** 40-60%
- **Industry leader:** 60%+

**Levers:** Onboarding experience, notification, immediate value delivery.

### Day 7 (D7) Retention
% of users who return within 7 days.

- **Good:** 15-25%
- **Great:** 25-40%

**Levers:** Habit formation, value demonstration, engagement loops.

### Day 30 (D30) Retention
% of users who return within 30 days.

- **Good:** 10-20%
- **Great:** 20-35%

**Levers:** Long-term value, community, content updates.

### LTV (Lifetime Value)
How much revenue per user over lifetime?

**Formula:** (Average purchase value × Purchase frequency) ÷ Churn rate

**Example:**
- Average purchase: $50
- Purchases per year: 4
- Churn: 40% annually

LTV = (50 × 4) ÷ 0.4 = $500 per user

**CAC (Customer Acquisition Cost)** = Total marketing spend ÷ New users

**Rule:** LTV should be 3-5x CAC for sustainable growth.

---

## The North Star Metric

Not all metrics matter equally. Your North Star is the one metric that correlates with revenue and retention.

### Examples by Business
- **SaaS:** Monthly Active Users (MAU) or ARR
- **Social:** Daily Active Users (DAU)
- **Ecommerce:** Revenue per session or repeat purchase rate
- **Marketplace:** GMV (Gross Merchandise Value)

**Rule:** Pick ONE. Everything else supports it.

---

## Data-Driven Decision Framework

1. **Ask a question** — "Why did conversion drop 5% this week?"
2. **Gather data** — Check GA4, cohorts, channel breakdowns
3. **Form hypothesis** — "Mobile conversion dropped because of checkout error"
4. **Test hypothesis** — Run experiment or check logs
5. **Implement fix** — Reduce friction, track results
6. **Measure impact** — Did it work? By how much?

**Wrong:** "I think we should change X"
**Right:** "Data shows Y is underperforming by Z%. Hypothesis: A. Test: B. Expected impact: C%"

---

## Red Flags

- 📊 **No clear conversion goal** → You're not measuring the right thing
- 📉 **Retention declining** → Product isn't delivering value
- 🔴 **CAC > LTV** → Business is unsustainable at scale
- ❌ **No mobile tracking** → Missing half your data
- 🎯 **Everyone watches different metrics** → No alignment on priorities

---

## Quick Audit Checklist

- [ ] GA4 properly installed? (Test with Google Tag Manager)
- [ ] Custom events tracked? (Purchase, sign-up, key actions)
- [ ] Conversion goal defined? (What counts as success?)
- [ ] Retention measured? (D1, D7, D30)
- [ ] Attribution modeled? (Multi-touch, not last-click only)
- [ ] Cohorts analyzed? (Which segments perform best?)
- [ ] CAC vs LTV calculated? (Business sustainable?)
- [ ] Dashboard created? (All metrics in one view)

---

**Last updated:** 2026-07-22  
**Primary sources:** GA4 docs, Facebook Business docs, analytics best practices 2026
